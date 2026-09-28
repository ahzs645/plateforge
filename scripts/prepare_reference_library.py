#!/usr/bin/env python3
"""Prepare a lazy-loaded reference catalogue from the raw import, without a network request.

The ten Leeward article URLs were independently checked through the browser on
2026-09-27. They are link-only records, not successful automated article imports.
Neither a photo URL nor an article record constitutes an editable plate design.

The Not a Tesla App catalogue (scripts/data/notateslaapp-catalog.tsv, 94 plate
visualisation pages listed on 2026-09-27) is recorded the same way: page links
only. Three detail pages were captured for research; none of their plate images
are imported, and safePreviewUrl never embeds that host.
"""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path('public/data')
TESLA_CATALOGUE = Path(__file__).parent / 'data' / 'notateslaapp-catalog.tsv'
TESLA_ORIGIN = 'https://www.notateslaapp.com'
TESLA_SITE = {'id': 'notateslaapp', 'name': 'Not a Tesla App', 'root': f'{TESLA_ORIGIN}/tesla-customizations/license-plates/',
    'prefix': '/tesla-customizations/license-plates/',
    'credit': 'Not a Tesla App — plate visualisations; link-only, artwork not redistributed'}
TESLA_CAPTURED = {'north-america/ca/alberta/alberta-standard', 'north-america/ca/alberta/alberta-moraine-lake',
    'north-america/us/california/california-black-white'}
TESLA_GROUPS = {'north-america/ca': 'Canadian provinces and territories', 'north-america/us': 'U.S. states and territories',
    'famous-themed': 'Novelty and themed'}
OUT = ROOT / 'reference-library'
ARTICLES = [
    ('intro', 'License plate fonts: introduction and historical survey'),
    ('nam', 'North American replica and inspired fonts'),
    ('nam-class', 'North American lettering classifications'),
    ('nam-flat', 'Flat digital plates and manufacturing'),
    ('nam-3m', '3M digital lettering discussion'),
    ('nam-3m-2', 'Embossed and digital lettering comparison'),
    ('nam-usdig', 'Digital replicas of embossed lettering'),
    ('eur', 'European number plate fonts: part 1'),
    ('eur-2', 'European number plate fonts: part 2'),
    ('aust', 'Australian and New Zealand number plate fonts'),
]

def category(url):
    name = unquote(urlsplit(url).path).lower()
    if 'notateslaapp.com' in url:
        rel = name.removeprefix(TESLA_SITE['prefix'])
        return next(label for prefix, label in TESLA_GROUPS.items() if rel.startswith(prefix + '/'))
    if 'leewardpro.com' in url:
        return 'Lettering research'
    groups = [
        ('Passenger bases', r'/passenger-(?:\d|1908)'),
        ('Commercial and farm', r'commercial|farm|logging|prorate|industrial|motivefuel|motorcarrier|passengercarrier|reciprocity|restricted|specialagreement'),
        ('Motorcycle and bicycle', r'motorcycle|bicycle|off-road'),
        ('Trailer and trade', r'trailer|dealer|manufacturer|repairer|transporter|temporary'),
        ('Special and personalized', r'parks|olympic|expo|collector|antique|personalized|pnp-|veteran|memorial|hamradio|supportourtroops|specialty'),
        ('Government and official', r'government|municipal|consular|national|publicworks|royal|lgpl8|apec|medicaldoctor'),
        ('Renewal and specimens', r'decal|sample|prototype'),
        ('Documents and history', r'registration|licensing|record-data|thesis|drivers-licence|chauffeur|bio/|keytag'),
    ]
    return next((label for label, pattern in groups if re.search(pattern, name)), 'Other source material')


def tesla_pages():
    rows = [line.split('\t') for line in TESLA_CATALOGUE.read_text(encoding='utf-8').splitlines()[1:] if line]
    assert len({r[3] for r in rows}) == len(rows), 'duplicate catalogue page'
    pages = []
    for _key, name, _jurisdiction, path in rows:
        url = TESLA_ORIGIN + path
        captured = path.removeprefix(TESLA_SITE['prefix']).strip('/') in TESLA_CAPTURED
        pages.append({'id': hashlib.sha256(url.encode()).hexdigest()[:16], 'source': 'notateslaapp', 'url': url,
            'title': name, 'headings': [], 'images': [], 'galleries': [], 'documents': [],
            'reviewStatus': 'detail-captured-link-only' if captured else 'catalogue-link-only',
            'sourceDate': '2026-09', 'htmlSha256': None})
    return pages


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def main():
    raw = json.loads((ROOT / 'plate-reference-library.json').read_text())
    old_leeward = [p for p in raw['pages'] if p['source'] == 'leeward']
    diagnostic = [{k: p.get(k) for k in ('url', 'title', 'headings', 'galleries')} | {'imageCount': len(p['images'])} for p in old_leeward]
    print('Leeward automated-response diagnostic:', json.dumps(diagnostic))
    pages = [p for p in raw['pages'] if p['source'] not in ('leeward', 'notateslaapp')] + tesla_pages()
    tesla = [p for p in pages if p['source'] == 'notateslaapp']
    captured = sum(p['reviewStatus'] == 'detail-captured-link-only' for p in tesla)
    assert captured == len(TESLA_CAPTURED), 'captured detail page missing from the catalogue'
    for slug, title in ARTICLES:
        url = f'https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-{slug}.html'
        pages.append({'id': hashlib.sha256(url.encode()).hexdigest()[:16], 'source': 'leeward', 'url': url,
            'title': title, 'headings': [], 'images': [], 'galleries': [], 'documents': [],
            'reviewStatus': 'browser-verified-link-only', 'sourceDate': '2011-02', 'htmlSha256': None})
    reports = [r for r in raw['reports'] if r['source'] != 'leeward'] + [{
        'source': 'leeward', 'complete': False, 'indexed': 0, 'manualReferences': 10,
        'scope': 'Ten browser-verified article links plus the separately curated historical classification; external specimen galleries not crawled.',
        'failures': [{'url': raw['sites'][1]['root'], 'reason': 'Automated response did not establish article-series coverage. Replaced with explicitly link-only browser-verified records; no completeness claim.'}],
        'remaining': [], 'automatedResponseDiagnostic': diagnostic,
    }, {
        'source': 'notateslaapp', 'complete': False, 'indexed': 0, 'catalogueLinks': len(tesla),
        'detailPagesCaptured': captured, 'imagesImported': 0,
        'scope': f'{len(tesla)} catalogue entries recorded as links; {captured} detail pages captured for research; no images imported. '
            'Plate visualisations remain on Not a Tesla App and are not redistributed or previewed.',
        'failures': [], 'remaining': [],
    }]
    index_pages = []
    for page in sorted(pages, key=lambda p: (p['source'], p['url'])):
        page['category'] = category(page['url'])
        page['yearHints'] = sorted(set(int(y) for y in re.findall(r'(?<!\d)((?:18|19|20)\d{2})(?!\d)', page['url'] + ' ' + page['title'])))
        write(OUT / 'pages' / f"{page['id']}.json", page)
        index_pages.append({k: v for k, v in page.items() if k not in ('images', 'galleries', 'documents')} | {
            'imageCount': len(page['images']), 'candidateImageCount': sum(i['kind'] != 'layout' for i in page['images']),
            'galleryCount': len(page['galleries']), 'documentCount': len(page['documents'])})
    totals = {'pages': len(pages), 'uniqueImageReferences': len({i['url'] for p in pages for i in p['images']}),
        'imageOccurrences': sum(len(p['images']) for p in pages), 'browserVerifiedArticleLinks': len(ARTICLES),
        'editableDesignsImportedFromImages': 0}
    totals['linkOnlyCatalogueEntries'] = len(tesla)
    index = {'schemaVersion': 2, 'importedAt': raw['importedAt'], 'preparedAt': '2026-09-27',
        'scope': raw['scope'], 'sites': [s for s in raw['sites'] if s['id'] != TESLA_SITE['id']] + [TESLA_SITE], 'reports': reports, 'totals': totals, 'pages': index_pages}
    write(OUT / 'index.json', index)
    report = {'totals': totals, 'reports': reports, 'notes': [
        'Counts are reference URLs, not distinct plate designs or verified working images.',
        'Unclassified images may include documents, people and other supporting material.',
        'No photographs, fonts or article bodies are mirrored. Article titles are bibliographic metadata.',
        'Not a Tesla App records are catalogue links only; its plate artwork is neither imported nor previewed.',
        'Missing and unlinked source pages, PDF contents and external archives are outside verified coverage.']}
    (OUT / 'coverage-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
