#!/usr/bin/env python3
"""Index public reference metadata, not photographs, fonts, or article bodies.

One request at a time; obey robots.txt; bounded scope, size, time and page count.
BCpl8s: linked HTML pages on that domain. Leeward: licence-plate-font series only.
External specimen galleries are recorded as links, not recursively mirrored.
Run from the repository root with Python >=3.10. No third-party dependencies.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import time
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit, quote
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

AGENT = 'PlateForgeReferenceIndex/1.0 (+https://github.com/ahzs645/plateforge)'
SITES = [
    {'id': 'bcpl8s', 'name': 'BCpl8s', 'root': 'https://www.bcpl8s.ca/', 'prefix': '/',
     'credit': 'Christopher John Garrish and credited contributors. Reference images remain on BCpl8s; no republication licence is assumed.'},
    {'id': 'leeward', 'name': 'Leeward Productions', 'root': 'https://www.leewardpro.com/articles/licplatefonts/licplate-fonts-nam-class.html',
     'prefix': '/articles/licplatefonts/', 'credit': 'Leeward Productions and credited specimen archives. Historical survey, not verified current issuance data.'},
]
IMAGE_EXT = re.compile(r'\.(?:jpe?g|png|gif|webp|svg)$', re.I)
DOCUMENT_EXT = re.compile(r'\.(?:pdf|docx?|xlsx?|zip)$', re.I)
LAYOUT_IMAGE = re.compile(r'(?:spacer|transparent|counter|banner|button|arrow|pixel|logo|favicon|bullet)', re.I)


def clean(text: str, limit: int = 160) -> str:
    return ' '.join(text.split())[:limit]


def canonical(base: str, value: str) -> str | None:
    try:
        p = urlsplit(urljoin(base, value.strip()))
        if p.scheme not in ('http', 'https') or p.username or p.password:
            return None
        host = p.netloc.lower()
        if host in ('bcpl8s.ca', 'www.bcpl8s.ca', 'leewardpro.com', 'www.leewardpro.com'):
            host = 'www.' + host.removeprefix('www.')
            scheme = 'https'
        else:
            scheme = p.scheme
        # Preserve already escaped bytes; URL fragments do not identify new pages.
        path = quote(p.path or '/', safe='/%:@!$&()*+,;=-._~')
        return urlunsplit((scheme, host, path, p.query, ''))
    except ValueError:
        return None


class PageParser(HTMLParser):
    def __init__(self, url: str):
        super().__init__(convert_charrefs=True)
        self.url = url
        self.title = ''
        self.heading = None
        self.headings: list[str] = []
        self.in_title = False
        self.anchor = None
        self.links: list[dict] = []
        self.images: list[dict] = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style'):
            self.hidden += 1
        if tag == 'title':
            self.in_title = True
        if re.fullmatch(r'h[1-6]', tag):
            self.heading = [tag, '']
        if tag == 'a':
            self.close_anchor()
            target = canonical(self.url, a.get('href') or '')
            self.anchor = {'url': target, 'label': ''} if target and a.get('href') else None
        if tag == 'img':
            src = canonical(self.url, a.get('src') or '')
            if not src or not a.get('src'):
                return
            def dimension(key):
                value = a.get(key) or ''
                return int(value) if value.isdecimal() else None
            width, height = dimension('width'), dimension('height')
            filename = unquote(urlsplit(src).path.rsplit('/', 1)[-1])
            target = self.anchor['url'] if self.anchor else None
            full = target if target and IMAGE_EXT.search(urlsplit(target).path) else src
            self.images.append({'url': full, 'thumbnailUrl': src,
                'label': clean(a.get('alt') or a.get('title') or filename, 100),
                'width': width, 'height': height,
                'kind': 'layout' if LAYOUT_IMAGE.search(filename) or (width and height and (width < 25 or height < 15)) else 'unclassified-reference'})

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.hidden = max(0, self.hidden - 1)
        if tag == 'title':
            self.in_title = False
        if self.heading and tag == self.heading[0]:
            value = clean(self.heading[1], 100)
            if value and value not in self.headings:
                self.headings.append(value)
            self.heading = None
        if tag == 'a':
            self.close_anchor()

    def handle_data(self, text):
        if self.hidden:
            return
        if self.in_title:
            self.title += text
        if self.heading:
            self.heading[1] += text
        if self.anchor:
            self.anchor['label'] += text

    def close_anchor(self):
        if self.anchor:
            self.anchor['label'] = clean(self.anchor['label'], 100)
            self.links.append(self.anchor)
            self.anchor = None


def fetch(url: str, size_limit: int = 4_000_000):
    with urlopen(Request(url, headers={'User-Agent': AGENT}), timeout=20) as response:
        body = response.read(size_limit + 1)
        if len(body) > size_limit:
            raise ValueError('response exceeds bounded HTML size')
        return response.geturl(), response.headers, body


def in_scope(url, site):
    p = urlsplit(url)
    return (p.netloc == urlsplit(site['root']).netloc and p.path.startswith(site['prefix'])
        and not p.query and (p.path.endswith('/') or re.search(r'\.html?$', p.path, re.I)))


def crawl(site, max_pages, delay):
    root = site['root']
    robot = RobotFileParser()
    robot_url = urljoin(root, '/robots.txt')
    robot_state = 'read'
    try:
        _, _, body = fetch(robot_url, 500_000)
        robot.parse(body.decode('utf-8', errors='replace').splitlines())
    except HTTPError as error:
        if error.code == 404:
            robot.parse([])
            robot_state = 'not-found-404'
        else:
            return [], {'source': site['id'], 'robots': str(error), 'complete': False, 'failures': [{'url': robot_url, 'reason': str(error)}], 'remaining': []}
    except (URLError, ValueError, TimeoutError) as error:
        return [], {'source': site['id'], 'robots': str(error), 'complete': False, 'failures': [{'url': robot_url, 'reason': str(error)}], 'remaining': []}
    wait = max(delay, float(robot.crawl_delay(AGENT) or robot.crawl_delay('*') or 0))
    queue, discovered, visited = deque([root]), {root}, set()
    pages, failures = [], []
    while queue and len(visited) < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)
        if not robot.can_fetch(AGENT, url):
            failures.append({'url': url, 'reason': 'robots-disallowed'})
            continue
        time.sleep(wait)
        try:
            final, headers, body = fetch(url)
            final = canonical(url, final)
            if not final or not in_scope(final, site):
                raise ValueError('redirect outside HTML crawl scope')
            if 'html' not in headers.get('Content-Type', '').lower():
                raise ValueError('not an HTML response')
            parser = PageParser(final)
            parser.feed(body.decode(headers.get_content_charset() or 'utf-8', errors='replace'))
            parser.close_anchor()
            links = list({item['url']: item for item in parser.links}.values())
            for item in links:
                target = item['url']
                if in_scope(target, site) and target not in discovered:
                    discovered.add(target)
                    queue.append(target)
            if final in {page['url'] for page in pages}:
                continue
            images = list({item['url']: item for item in parser.images}.values())
            external = [item for item in links if urlsplit(item['url']).netloc != urlsplit(final).netloc
                and any(host in urlsplit(item['url']).netloc for host in ('plateshack.com', '15q.net', 'worldlicenseplates.com'))]
            documents = [item for item in links if DOCUMENT_EXT.search(urlsplit(item['url']).path)]
            pages.append({'id': hashlib.sha256(final.encode()).hexdigest()[:16], 'source': site['id'], 'url': final,
                'title': clean(parser.title) or unquote(urlsplit(final).path.rsplit('/', 1)[-1]) or site['name'],
                'headings': parser.headings, 'images': images, 'galleries': external, 'documents': documents,
                'htmlSha256': hashlib.sha256(body).hexdigest(), 'reviewStatus': 'indexed-not-curated'})
            print(f"{site['id']}: {len(pages)} pages; queue={len(queue)}; {final}", flush=True)
        except (HTTPError, URLError, ValueError, TimeoutError, OSError) as error:
            failures.append({'url': url, 'reason': str(error)[:200]})
            print(f'SKIP {url}: {error}', flush=True)
            if isinstance(error, HTTPError) and error.code in (401, 403, 429):
                break
    return pages, {'source': site['id'], 'robots': robot_state, 'complete': not queue and not failures,
        'scope': 'linked HTML in configured scope only; not unlinked pages, image contents, PDF contents or external archives',
        'discovered': len(discovered), 'attempted': len(visited), 'indexed': len(pages),
        'failures': failures, 'remaining': list(queue)}


def main():
    arg = argparse.ArgumentParser()
    arg.add_argument('--output', default='public/data/plate-reference-library.json')
    arg.add_argument('--max-pages', type=int, default=600)
    arg.add_argument('--delay', type=float, default=0.4)
    options = arg.parse_args()
    if options.max_pages < 1 or options.max_pages > 1000 or options.delay < 0.25:
        arg.error('max-pages must be 1–1000 and delay at least 0.25 seconds')
    pages, reports = [], []
    for site in SITES:
        found, report = crawl(site, options.max_pages, options.delay)
        pages.extend(found)
        reports.append(report)
    data = {'schemaVersion': 1, 'importedAt': datetime.now(timezone.utc).isoformat(),
        'scope': 'Public reference metadata; images are externally hosted references, not editable plate designs.',
        'sites': SITES, 'reports': reports, 'pages': sorted(pages, key=lambda p: (p['source'], p['url']))}
    output = Path(options.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    summary = {'pages': len(pages), 'uniqueImages': len({im['url'] for p in pages for im in p['images']}),
        'imageOccurrences': sum(len(p['images']) for p in pages), 'reports': reports}
    output.with_name('plate-reference-import-report.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps({**summary, 'reports': [{k:v for k,v in r.items() if k not in ('failures','remaining')} for r in reports]}, indent=2))
    if not pages:
        raise SystemExit('No pages imported; refusing an empty snapshot')


if __name__ == '__main__':
    main()
