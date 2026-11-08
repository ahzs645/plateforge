"""Conservative paint segmentation for relative decal diagnostics, not OCR.

A matching component count is only a candidate assignment. Keep provisional
windows for inspection, but withhold scores and gaps when basic paint geometry,
crop boundaries, resolution or threshold stability do not support measurement.
"""
import numpy as np
from scipy import ndimage

MIN_CAP_PIXELS = 12
THRESHOLD_OFFSETS = (-0.05, 0.05)


def mask_for(image, positive, offset=0):
    values = ndimage.gaussian_filter(np.asarray(image.convert('L'), dtype=float), .35)
    lo, hi = np.percentile(values, [12, 88])
    for _ in range(12):
        split = (lo + hi) / 2
        low, high = values[values < split], values[values >= split]
        if len(low):
            lo = low.mean()
        if len(high):
            hi = high.mean()
    threshold = (lo + hi) / 2 + offset * (hi - lo)
    mask = values > threshold if positive else values < threshold
    labels, count = ndimage.label(mask)
    for label in range(1, count + 1):
        ys, xs = np.where(labels == label)
        if len(xs) < 2 or (xs.max() - xs.min() > image.width * .95 and ys.max() - ys.min() < 2):
            mask[labels == label] = False
    return mask, round(float(hi - lo), 2)


def _candidate_segments(mask, expected):
    occupied = mask.any(axis=0)
    edges = np.diff(np.r_[False, occupied, False].astype(int))
    starts, ends = np.where(edges == 1)[0], np.where(edges == -1)[0]
    spans = list(zip(starts, ends))
    method = 'independent paint projection'
    if len(spans) != expected:
        labels, count = ndimage.label(mask)
        components = []
        for label in range(1, count + 1):
            ys, xs = np.where(labels == label)
            if len(xs) >= 2:
                components.append((int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1), label))
        if len(components) == expected:
            components.sort(key=lambda box: (box[0] + box[2]) / 2)
            return ([list(box[:4]) for box in components], 'independent connected paint components',
                    [labels[box[1]:box[3], box[0]:box[2]] == box[4] for box in components])
        nonempty = np.where(occupied)[0]
        left, right = (nonempty.min(), nonempty.max() + 1) if len(nonempty) else (0, mask.shape[1])
        divisions = np.linspace(left, right, expected + 1).round().astype(int)
        spans = list(zip(divisions[:-1], divisions[1:]))
        method = f'uncertain partition: {len(starts)} paint spans for {expected} occurrences'
    boxes = []
    for x0, x1 in spans:
        x0 = max(0, min(mask.shape[1] - 1, int(x0)))
        x1 = max(x0 + 1, min(mask.shape[1], int(x1)))
        ys, xs = np.where(mask[:, x0:x1])
        boxes.append([int(x0 + xs.min()), int(ys.min()), int(x0 + xs.max() + 1), int(ys.max() + 1)] if len(xs)
                     else [x0, 0, x1, mask.shape[0]])
    return boxes, method, [mask[box[1]:box[3], box[0]:box[2]] for box in boxes]


def _geometry_reasons(boxes, characters, shape):
    reasons = []
    capitals = [box for char, box in zip(characters, boxes) if char.isalnum()]
    heights = [box[3] - box[1] for box in capitals]
    if heights and (min(heights) < 3 or min(heights) < .6 * max(heights)):
        reasons.append('implausible cap-height disparity or paint fragment')
    if capitals and min(box[3] for box in capitals) - max(box[1] for box in capitals) < .4 * min(heights):
        reasons.append('capital/number paint does not share a plausible vertical band')
    if any(box[2] - box[0] > 2 * max(1, box[3] - box[1]) for box in capitals):
        reasons.append('an alphanumeric window is too wide to trust as one glyph')
    if any(box[0] <= 0 or box[1] <= 0 or box[2] >= shape[1] or box[3] >= shape[0] for box in boxes):
        reasons.append('paint touches the inspection-crop boundary; clipping is unresolved')
    return reasons


def _box_iou(a, b):
    intersection = max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - intersection
    return intersection / union if union else 0


def segment_source(mask, characters, contrast=255, threshold_masks=()):
    """Return occurrence windows plus explicit eligibility; no false measured gaps."""
    characters = list(characters)
    if not characters:
        return {'boxes': [], 'masks': [], 'method': 'no printed occurrences', 'accepted': False,
                'reasons': ['no printed occurrences'], 'eligible': [], 'gaps': [], 'thresholdChecks': []}
    boxes, method, isolated = _candidate_segments(mask, len(characters))
    reasons = []
    if not method.startswith('independent'):
        reasons.append('paint does not independently isolate the expected occurrence count')
    reasons.extend(_geometry_reasons(boxes, characters, mask.shape))
    if contrast < 20:
        reasons.append('source contrast below 20 grayscale levels')
    checks = []
    for alternative in threshold_masks:
        other, other_method, _ = _candidate_segments(alternative, len(characters))
        union = np.logical_or(mask, alternative).sum()
        paint_iou = float(np.logical_and(mask, alternative).sum() / union) if union else 0
        stable = (other_method.startswith('independent') and len(other) == len(boxes)
                  and not _geometry_reasons(other, characters, mask.shape)
                  and all(_box_iou(a, b) >= .65 for a, b in zip(boxes, other)) and paint_iou >= .8)
        checks.append({'stable': bool(stable), 'paintMaskIoU': round(paint_iou, 4), 'method': other_method})
        if not stable:
            reasons.append('segmentation or paint mask changes materially under threshold perturbation')
    reasons = list(dict.fromkeys(reasons))
    accepted = not reasons
    eligible = [bool(accepted and box[3] - box[1] >= MIN_CAP_PIXELS and paint.any()) for box, paint in zip(boxes, isolated)]
    gaps = [boxes[index + 1][0] - box[2] if index + 1 < len(boxes) and eligible[index] and eligible[index + 1] else None
            for index, box in enumerate(boxes)]
    return {'boxes': boxes, 'masks': isolated, 'method': method, 'accepted': accepted, 'reasons': reasons,
            'eligible': eligible, 'gaps': gaps, 'thresholdChecks': checks}
