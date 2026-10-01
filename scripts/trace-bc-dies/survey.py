"""Survey BCpl8s for what it says about makers, dies and lettering.

Usage: python3 survey.py [output.md]
Crawls the site two links deep (one request at a time; cached in .cache/survey-pages.json), then keeps every
sentence that mentions dies, fonts, numerals, lettering or re-stamping. The passenger chapters come first,
in date order, then every other page. The excerpts are quotations for research; they stay BCpl8s's text."""
import html, json, os, re, sys, time, urllib.request

BASE = 'https://www.bcpl8s.ca/'
CACHE = '.cache/survey-pages.json'
OUT = sys.argv[1] if len(sys.argv) > 1 else '../../docs/research/bc-lettering/notes/bcpl8s-excerpts.md'
SKIP = re.compile(r'(Links|Contributors|Meet|News|Guinness|Keytags|Drivers-Licences|Chauffeurs|VIN|Tales|Runs|Highs|Lows|HistoricNumbers|BC-Registration-Data|bio/)', re.I)

def crawl():
    seen, queue, pages = set(), [('', 0)], {}
    while queue:
        path, depth = queue.pop(0)
        if path in seen: continue
        seen.add(path)
        req = urllib.request.Request(BASE + path, headers={'User-Agent': 'PlateForge die research (https://github.com/ahzs645/plateforge)'})
        try: raw = urllib.request.urlopen(req, timeout=30).read().decode('latin-1')
        except Exception as e: print('fail', path, e); continue
        time.sleep(0.25)
        text = re.sub(r'<[^>]+>', ' ', re.sub(r'(?is)<(script|style).*?</\1>', ' ', raw))
        pages[path or 'index'] = html.unescape(re.sub(r'\s+', ' ', text))
        if depth >= 2: continue
        for href in set(re.findall(r'href="([^"#?]+\.html?)"', raw)):
            if href.startswith(('http', '../')) or SKIP.search(href): continue
            href = href.lstrip('./')
            if href not in seen: queue.append((href, depth + 1))
    os.makedirs('.cache', exist_ok=True); json.dump(pages, open(CACHE, 'w'))
    return pages

pages = json.load(open(CACHE)) if os.path.exists(CACHE) else crawl()
# Lettering words only; maker names alone pull in too much business history.
LETTERING = re.compile(r'\b(dies|die type|die set|font|fonts|numerals?|lettering|typeface|serif|slant(ed)?|italic|re-?stamp\w*)\b', re.I)
passenger = sorted((k for k in pages if k.startswith('Passenger-')), key=lambda k: re.findall(r'\d{4}', k) or ['9999'])
others = sorted(k for k in pages if k not in passenger and k != 'index')
lines = ['# BCpl8s lettering excerpts', '',
         f'Sentences from {len(pages)} [BCpl8s](https://www.bcpl8s.ca/) pages (Christopher Garrish) that mention dies, fonts,',
         'numerals, lettering or re-stamping, collected by `scripts/trace-bc-dies/survey.py` for the era survey in',
         '[bc-font-eras.md](../../../bc-font-eras.md). The text is quoted from BCpl8s for research and remains theirs;',
         'follow each heading to the page for context and photo credits.', '']
for key in passenger + others:
    seen, hits = set(), []
    for s in re.split(r'(?<=[.!?])\s+', pages[key]):
        s = s.strip()
        if len(s) <= 700 and LETTERING.search(s) and s not in seen: seen.add(s); hits.append(s)
    if hits:
        lines += [f'## [{key}]({BASE}{key})', ''] + [f'- {s}' for s in hits] + ['']
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write('\n'.join(lines))
print('wrote', OUT, sum(1 for l in lines if l.startswith('- ')), 'excerpts from', sum(1 for l in lines if l.startswith('## ')), 'pages')
