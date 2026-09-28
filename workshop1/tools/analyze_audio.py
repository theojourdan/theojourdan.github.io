"""Regenerate features.json with FFmpeg (no audio modification).

Centroid: arithmetic mean over frames and channels, Hann window of 2048
samples, 50% overlap, native sample rate. Loudness: EBU R128 integrated LUFS.
See https://ffmpeg.org/ffmpeg-filters.html#aspectralstats and #ebur128.
"""
from pathlib import Path
import json
import math
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def analyze(path):
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
    return {'id': path.stem, 'centroid': round(sum(values) / len(values), 2), 'loudness': integrated}

if __name__ == '__main__':
    datasets = {folder.name: [analyze(p) for p in sorted(folder.glob('*.wav'))]
                for folder in sorted((ROOT / 'audio').glob('dataset*'))}
    (ROOT / 'features.json').write_text(json.dumps(datasets, indent=2) + '\n')
    print('Analyzed', sum(map(len, datasets.values())), 'sounds')
