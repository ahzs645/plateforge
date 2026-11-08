"""Read original-byte-verified photos or explicitly scoped, pinned local crops."""
import hashlib
import json
from pathlib import Path
from PIL import Image


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_cached_crop(reference, root, manifest):
    record = manifest['specimens'].get(reference['id'])
    if not record:
        raise ValueError('No pinned cached crop for ' + reference['id'])
    expected = (reference['source'], reference['sourceSha256'], reference['crop'])
    actual = (record['source'], record['recordedOriginalSha256'], record['originalCrop'])
    if actual != expected:
        raise ValueError('Cached crop provenance does not match the source binding for ' + reference['id'])
    path = root / record['file']
    if sha256(path) != record['sha256']:
        raise ValueError('Changed cached crop: ' + reference['id'])
    with Image.open(path) as image:
        photo = image.convert('RGB')
    if list(photo.size) != record['pixels'] or list(photo.size) != [reference['crop'][2] - reference['crop'][0], reference['crop'][3] - reference['crop'][1]]:
        raise ValueError('Cached crop dimensions do not match the original crop for ' + reference['id'])
    return photo, {'mode': 'cached-crop', 'file': record['file'], 'verifiedSha256': record['sha256'],
                   'hashScope': manifest['hashScope'], 'originalBytesVerified': False,
                   'recordedOriginalSha256': record['recordedOriginalSha256']}


def read_original_crop(reference, root, work):
    path = Path(reference['photoFile']) if reference.get('photoFile') else Path('/tmp/plateforge-decal-review') / (reference['id'] + '.jpg')
    if not path.is_absolute():
        path = root / path if (root / path).exists() else work / 'photos' / path
    if not path.exists():
        raise FileNotFoundError(f'Missing original photo for {reference["id"]}: {path}. Download originals or explicitly use --cached-crops.')
    digest = sha256(path)
    if digest != reference['sourceSha256']:
        raise ValueError('Changed original source: ' + reference['id'])
    with Image.open(path) as image:
        x0, y0, x1, y1 = reference['crop']
        if not (0 <= x0 < x1 <= image.width and 0 <= y0 < y1 <= image.height):
            raise ValueError('Source crop is outside original image: ' + reference['id'])
        photo = image.convert('RGB').crop((x0, y0, x1, y1))
    return photo, {'mode': 'original', 'file': reference.get('photoFile', path.name), 'verifiedSha256': digest,
                   'hashScope': 'Original source image bytes, before the recorded crop', 'originalBytesVerified': True,
                   'recordedOriginalSha256': reference['sourceSha256']}


def load_crop_manifest(root):
    return json.loads((root / 'docs/research/decal-online-analysis/cached-crop-manifest.json').read_text())
