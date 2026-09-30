"""Regenerate features.json with FFmpeg and NumPy (no audio modification).

Mean frequency: full-length one-sided power-weighted periodogram frequency, Hz.
Mean energy: mean squared normalized PCM amplitude, averaged across channels.
Reference: https://www.mathworks.com/help/signal/ref/meanfreq.html

Centroid: arithmetic mean over frames and channels, Hann window of 2048
samples, 50% overlap, native sample rate. Loudness: EBU R128 integrated LUFS.
See https://ffmpeg.org/ffmpeg-filters.html#aspectralstats and #ebur128.
"""
from pathlib import Path
import numpy as np
import hashlib
import json
import math
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def additional_features(samples, rate):
    # Full-length rectangular periodogram; sum channel powers (no phase cancellation).
    power = np.sum(np.abs(np.fft.rfft(samples, axis=0)) ** 2, axis=1)
    power[1:-1 if len(samples) % 2 == 0 else None] *= 2
    frequencies = np.fft.rfftfreq(len(samples), 1 / rate)
    mean_frequency = float(np.dot(frequencies, power) / power.sum()) if power.sum() else 0.0
    return mean_frequency, float(np.mean(samples ** 2))


def analyze(path):
    stream = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(path)]))['streams'][0]
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-c:a', 'pcm_f64le', '-'])
    samples = np.frombuffer(raw, dtype='<f8').reshape(-1, stream['channels'])
    mean_frequency, mean_energy = additional_features(samples, int(stream['sample_rate']))
    spectral = subprocess.run([
        'ffmpeg', '-v', 'error', '-i', str(path), '-af',
        'aspectralstats=win_size=2048:win_func=hann:overlap=0.5:measure=centroid,ametadata=print:file=-',
        '-f', 'null', '-'], capture_output=True, text=True, check=True).stdout
    values = [float(v) for v in re.findall(r'centroid=([^\s]+)', spectral)]
    values = [v for v in values if math.isfinite(v)]
    loudness = subprocess.run([
        'ffmpeg', '-hide_banner', '-nostats', '-i', str(path),
        '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True, check=True).stderr
    integrated = float(re.findall(r'I:\s*([-\d.]+) LUFS', loudness)[-1])
    if not values or not math.isfinite(integrated):
        raise ValueError(f'Cannot analyze {path}')
    return {'id': path.stem, 'version': hashlib.sha256(path.read_bytes()).hexdigest()[:12], 'meanFrequency': round(mean_frequency, 2), 'meanEnergy': mean_energy, 'centroid': round(sum(values) / len(values), 2), 'loudness': integrated}

if __name__ == '__main__':
    datasets = {folder.name: [analyze(p) for p in sorted(folder.glob('[0-9][0-9].wav'))]
                for folder in [ROOT / 'audio' / name for name in ('dataset2', 'dataset3', 'dataset4')]}
    (ROOT / 'features.json').write_text(json.dumps(datasets, indent=2) + '\n')
    print('Analyzed', sum(map(len, datasets.values())), 'sounds')
