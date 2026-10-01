"""Combine the 1940–48 and 1949–51 serial-digit averages (weighted by sample count) into one 1940–51 set."""
import json, os
import numpy as np
from PIL import Image

S = json.load(open('out/summary.json'))['summary']['serial']
for c in '0123456789':
    ims, ws = [], []
    for era in ['1940-48', '1949-51']:
        p = f'out/serial-{era}-{c}.png'
        if os.path.exists(p) and c in S.get(era, {}):
            ims.append(1 - np.asarray(Image.open(p).convert('L')).astype(float) / 255); ws.append(S[era][c]['n'])
    H = max(i.shape[0] for i in ims); W = max(i.shape[1] for i in ims)
    acc = np.zeros((H, W))
    for i, w in zip(ims, ws):
        pad = np.zeros((H, W)); x0 = (W - i.shape[1]) // 2; pad[:i.shape[0], x0:x0 + i.shape[1]] = i; acc += pad * w
    Image.fromarray((255 - acc / sum(ws) * 255).astype(np.uint8)).save(f'out/serial-4051-{c}.png')
