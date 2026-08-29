import json, re, subprocess, sys
from collections import Counter
from urllib.parse import urljoin, urlparse

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

def fetch(url, timeout=40):
    try:
        r = subprocess.run(
            ['curl','-sS','--max-time',str(timeout),'-L','-A',UA,url],
            capture_output=True, timeout=timeout+10)
        return r.stdout.decode('utf-8','ignore')
    except Exception as e:
        return ''

SITES = json.load(open(sys.argv[1]))
out = {}

for s in SITES:
    name, url = s['name'], s['url']
    html = fetch(url)
    if not html:
        out[name] = {'url': url, 'ok': False, 'error': 'empty html'}
        print(f'FAIL {name}', file=sys.stderr); continue

    # collect css hrefs
    hrefs = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\']', html, re.I)
    hrefs += re.findall(r'href=["\']([^"\']*\.css[^"\']*)["\']', html, re.I)
    hrefs = list(dict.fromkeys(hrefs))[:8]
    css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', html, re.S|re.I))
    fetched = []
    for h in hrefs:
        full = urljoin(url, h)
        c = fetch(full, 30)
        if c:
            css += '\n' + c
            fetched.append({'url': full, 'bytes': len(c)})

    # ---- extract design facts ----
    props = Counter()
    for m in re.finditer(r'(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]{1,120})', css):
        props[(m.group(1), m.group(2).strip()[:80])] += 1

    beziers = Counter(re.findall(r'cubic-bezier\(\s*([^)]{1,60})\)', css))
    durations = Counter()
    for m in re.finditer(r'(?:transition(?:-duration)?|animation(?:-duration)?)\s*:\s*([^;{}]{1,120})', css):
        for d in re.findall(r'(\d*\.?\d+)(m?s)\b', m.group(1)):
            v = float(d[0]) * (1 if d[1]=='ms' else 1000)
            if 0 < v <= 8000: durations[int(v)] += 1

    clamps = Counter(re.findall(r'clamp\(\s*([^)]{1,90})\)', css))
    families = Counter()
    for m in re.finditer(r'font-family\s*:\s*([^;{}]{1,120})', css):
        first = m.group(1).split(',')[0].strip().strip('"\'')
        if first and not first.startswith('var('): families[first] += 1

    fontfaces = Counter(re.findall(r'@font-face[^}]*?font-family\s*:\s*["\']?([^;"\'}]+)', css, re.S))
    hexes = Counter(c.lower() for c in re.findall(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', css))
    weights = Counter(re.findall(r'font-weight\s*:\s*(\d{3})', css))
    mixblend = Counter(re.findall(r'mix-blend-mode\s*:\s*([a-z-]+)', css))
    willchange = Counter(re.findall(r'will-change\s*:\s*([^;{}]{1,40})', css))
    reduced = len(re.findall(r'prefers-reduced-motion', css))
    breakpoints = Counter(re.findall(r'@media[^{]*?(?:min|max)-width\s*:\s*(\d+)\s*px', css))
    gridcols = Counter(re.findall(r'grid-template-columns\s*:\s*([^;{}]{1,60})', css))

    # runtime/library fingerprints from HTML
    low = html.lower()
    libs = {k: (k in low) for k in
            ['lenis','gsap','three','r3f','next/static','_next','astro','webgl',
             'framer','motion','tailwind','sanity','mux','vercel','swiper','locomotive']}
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
    canvas = low.count('<canvas')
    video = low.count('<video')
    imgs = low.count('<img')
    title = (re.search(r'<title[^>]*>(.*?)</title>', html, re.S|re.I) or [None,''])[1].strip()[:120]

    out[name] = {
        'url': url, 'ok': True, 'title': title,
        'htmlBytes': len(html), 'cssFiles': fetched, 'cssBytes': len(css),
        'customProps': [[f'{k[0]}: {k[1]}', v] for k,v in props.most_common(40)],
        'customPropCount': len(props),
        'cubicBeziers': beziers.most_common(12),
        'durationsMs': durations.most_common(14),
        'clamps': [[c,n] for c,n in clamps.most_common(10)],
        'fontFamilies': families.most_common(10),
        'fontFaces': fontfaces.most_common(10),
        'fontWeights': weights.most_common(8),
        'topHexColors': hexes.most_common(14),
        'mixBlendModes': mixblend.most_common(6),
        'willChange': willchange.most_common(6),
        'prefersReducedMotionHits': reduced,
        'breakpointsPx': breakpoints.most_common(10),
        'gridTemplates': gridcols.most_common(6),
        'libs': {k:v for k,v in libs.items() if v},
        'scriptCount': len(scripts),
        'canvasTags': canvas, 'videoTags': video, 'imgTags': imgs,
    }
    print(f'OK   {name}  css={len(css)}B props={len(props)} bez={len(beziers)}', file=sys.stderr)

json.dump(out, open(sys.argv[2],'w'), indent=2)
print('written', file=sys.stderr)
