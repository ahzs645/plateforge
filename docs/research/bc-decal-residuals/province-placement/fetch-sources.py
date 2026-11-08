#!/usr/bin/env python3
"""Fetch the explicitly selected, credited Commons originals for the second pass.

Each original is preserved byte-for-byte. Metadata and the description-page hash
record the attribution/licence observed when fetched. This is a read-only network
operation; no authentication or private repository data is sent.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.parse import quote

from PIL import Image

HERE = Path(__file__).resolve().parent
SELECTED = [
    ('1981-oct', 'British Columbia Sticker Decal October 1981.jpg'),
    ('1982-jul', 'British Columbia Sticker Decal July 1982.jpg'),
    ('1984-apr', 'British Columbia Sticker Decal April 1984.jpg'),
    ('1985-feb', 'British Columbia Sticker Decal February 1985.jpg'),
    ('1987-feb', 'British Columbia Sticker Decal February 1987.jpg'),
    ('1988-feb', 'British Columbia Sticker Decal February 1988.jpg'),
    ('1989-jul', 'British Columbia Sticker Decal July 1989.jpg'),
    ('1990-jan', 'British Columbia Sticker Decal January 1990.jpg'),
    ('1991-jan', 'British Columbia Sticker Decal January 1991.jpg'),
    ('1992-dec', 'British Columbia Sticker Decal December 1992.jpg'),
    ('1993-jan', 'British Columbia Sticker Decal January 1993.jpg'),
    ('1994-mar', 'British Columbia Sticker Decal March 1994.jpg'),
    ('1996-nov', 'British Columbia Sticker Decal November 1996.jpg'),
    ('1997-jul', 'British Columbia Sticker Decal July 1997.jpg'),
    ('2004', '2004 British Columbia licence plate decal.png'),
    ('2005-jul', 'British Columbia Sticker Decal July 2005.jpg'),
    ('2006-apr', 'ICBC Apr 2006 Registration Decal.png'),
    ('2007-jan', 'British Columbia Sticker Decal January 2007.jpg'),
    ('2009-may', 'British Columbia Sticker Decal May 2009.jpg'),
    ('2010-dec', '2010 British Columbia license plate registration decal December expiry.png'),
    ('2012-aug', 'ICBC Aug 2012 Registration Decal.png'),
]


def fetch(url):
    # Deliberately do not retry a rate limit. A later invocation can resume the
    # byte-verified cache after the server's Retry-After interval has elapsed.
    result = subprocess.run(['curl', '-fsSL', '--max-time', '45', url],
                            capture_output=True)
    if result.returncode:
        if b'429' in result.stderr:
            raise RuntimeError('HTTP 429: stop this batch and respect the server Retry-After interval')
        result.check_returncode()
    return result.stdout


def text(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(s))).strip()


def process(item):
    key, title = item
    cache = HERE / 'sources' / (key + '.json')
    if cache.exists():
        record = json.loads(cache.read_text())
        original = HERE / record['localFile']
        if original.exists() and hashlib.sha256(original.read_bytes()).hexdigest() == record['sha256']:
            return record
    page = 'https://commons.wikimedia.org/wiki/File:' + quote(title.replace(' ', '_'))
    page_bytes = fetch(page)
    markup = html.unescape(page_bytes.decode('utf8'))
    data = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', markup, re.S)[1])
    assert data['@type'] == 'ImageObject'
    original_url = data['contentUrl'].split('?')[0]
    target = HERE / 'sources' / (key + Path(title).suffix.lower())
    original = target.read_bytes() if target.exists() else fetch(original_url)
    target.write_bytes(original)
    with Image.open(target) as im:
        size = list(im.size)
    def field(key):
        found = re.search(r'id="fileinfotpl_' + key + r'"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', markup, re.S)
        return text(found[1]) if found else None
    record = {'id': key, 'title': title, 'descriptionPage': page, 'originalUrl': original_url,
              'localFile': str(target.relative_to(HERE)), 'pixels': size, 'bytes': len(original),
              'sha256': hashlib.sha256(original).hexdigest(),
              'descriptionPageSha256': hashlib.sha256(page_bytes).hexdigest(),
              'author': field('aut'), 'sourceAttribution': field('src'),
              'photographDateAsPublished': field('date'), 'licence': data.get('license'),
              'fetchedAt': datetime.now(timezone.utc).isoformat(),
              'changes': 'Original file preserved without editing; separate review crops and overlays are derived artifacts.',
              'evidenceStatus': 'Photographed specimen. Caption date/expiry does not independently establish manufacture date or ordinary issuance.'}
    assert record['author'] and record['licence'], key + ': missing credit or licence'
    cache.write_text(json.dumps(record, indent=2) + '\n')
    print(key, size, record['author'], record['licence'], flush=True)
    return record


def main():
    (HERE / 'sources').mkdir(parents=True, exist_ok=True)
    def safe_process(item):
        try:
            return process(item)
        except Exception as error:
            print(item[0], 'FETCH FAILED', str(error), getattr(error, 'stderr', b'').decode(errors='replace'), flush=True)
            return None
    selected = SELECTED
    if '--existing-only' in sys.argv:
        selected = [item for item in selected if (HERE / 'sources' / (item[0] + Path(item[1]).suffix.lower())).exists()]
    requested = [arg for arg in sys.argv[1:] if not arg.startswith('--')]
    if requested:
        selected = [item for item in selected if item[0] in requested]
    records = []
    for item in selected:
        try:
            record = process(item)
            if record: records.append(record)
        except RuntimeError as error:
            print(error, flush=True)
            break
        except Exception as error:
            print(item[0], 'FETCH FAILED', str(error), flush=True)
        time.sleep(2)
    # Preserve already downloaded records even when only one new source was
    # requested or a later source was rate-limited.
    records = [json.loads(path.read_text()) for path in sorted((HERE / 'sources').glob('*.json'))]
    (HERE / 'source-manifest.json').write_text(json.dumps(records, indent=2) + '\n')


if __name__ == '__main__':
    main()
