#!/usr/bin/env python3
"""Build the public site into dist/.

Source guide fragments live in src/guides and are NEVER published directly.
Canonical guide pages plus legacy compatibility redirects are generated under
 dist/guias/.
"""
from pathlib import Path
import json, html, re, shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
BASE = 'https://kelonio-hub.github.io/Archivos-Kelonio/'


data = json.loads((ROOT / 'data' / 'guides.json').read_text(encoding='utf-8'))
template = (ROOT / 'src' / 'templates' / 'guide.html').read_text(encoding='utf-8')
header = (ROOT / 'src' / 'templates' / 'header.html').read_text(encoding='utf-8').strip()

# Start with a clean public output directory.
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir(parents=True)

# Copy only public/static material. Source, build scripts and metadata stay private
# to the repository and are not exposed by the GitHub Pages artifact.
exclude_top = {'.git', '.github', 'src', 'scripts', 'data', 'discord', 'guias', 'dist', 'README_V2.md'}
for item in ROOT.iterdir():
    if item.name in exclude_top:
        continue
    target = DIST / item.name
    if item.is_dir():
        shutil.copytree(item, target)
    else:
        shutil.copy2(item, target)

# GitHub Pages should not process the artifact through Jekyll.
(DIST / '.nojekyll').write_text('', encoding='utf-8')
(DIST / 'guias').mkdir(parents=True, exist_ok=True)


def meta_tags(prefix, m):
    return '\n  '.join(
        f'<meta name="{prefix}-{l}" content="{html.escape(str(m.get(l, "")), quote=True)}">'
        for l in data['languages']
    )


def schema_for(g):
    canonical = BASE + 'guias/' + g['file']
    title = g['titles'].get('es') or g['titles'].get('en') or g['file']
    desc = g['descs'].get('es') or g['descs'].get('en') or ''
    graph = [
        {
            '@type': 'Organization', '@id': BASE + '#organization', 'name': 'La Presa',
            'url': BASE,
            'logo': {'@type': 'ImageObject', 'url': BASE + 'img/Lucario.gif'}
        },
        {
            '@type': 'WebPage', '@id': canonical + '#webpage', 'url': canonical,
            'name': title + ' | La Presa', 'description': desc, 'inLanguage': 'es',
            'isPartOf': {'@id': BASE + '#website'}
        },
        {
            '@type': 'BreadcrumbList',
            'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': BASE},
                {'@type': 'ListItem', 'position': 2, 'name': 'Guías', 'item': BASE + 'guias.html'},
                {'@type': 'ListItem', 'position': 3, 'name': title, 'item': canonical}
            ]
        }
    ]
    graph += g.get('schemaExtras', [])
    return '\n'.join(
        '<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False, indent=2) + '</script>'
        for x in graph if isinstance(x, dict)
    )


idx = []
for g in sorted(data['guides'], key=lambda x: (x.get('date') or '', x['slug']), reverse=True):
    content_path = ROOT / 'src' / 'guides' / (g['slug'] + '.html')
    content = content_path.read_text(encoding='utf-8')
    canonical = BASE + 'guias/' + g['file']
    title = g['titles'].get('es') or g['titles'].get('en') or g['file'].removesuffix('.html')
    desc = g['descs'].get('es') or g['descs'].get('en') or ''
    hreflang = '\n  '.join(
        f'<link rel="alternate" hreflang="{l}" href="{canonical}?lang={l}">' for l in data['languages']
    ) + f'\n  <link rel="alternate" hreflang="x-default" href="{canonical}?lang=en">'
    over = f'<link rel="stylesheet" href="../assets/guide-overrides/{g["styleOverride"]}">' if g.get('styleOverride') else ''
    paypal = '<script src="../js/guide-paypal.js" defer></script>' if ('paypal-support-widget' in content or 'paypal-button-container' in content) else ''
    page = template
    vals = {
        'GUIDE_ID': g['id'],
        'GUIDE_ID_JSON': json.dumps(g['id']),
        'TITLE_ES': html.escape(title, quote=True),
        'DESC_ES': html.escape(desc, quote=True),
        'TAG': html.escape(g['tag'], quote=True),
        'DATE': html.escape(g['date'], quote=True),
        'CANONICAL': canonical,
        'OG_IMAGE': BASE + 'img/Logo%20Zip.png',
        'GUIDE_TITLE_METAS': meta_tags('guide-title', g['titles']),
        'GUIDE_DESC_METAS': meta_tags('guide-desc', g['descs']),
        'HREFLANG': hreflang,
        'OVERRIDE_CSS': over,
        'SCHEMA': schema_for(g),
        'HEADER': header,
        'CONTENT': content,
        'PAYPAL_JS': paypal,
    }
    for k, v in vals.items():
        page = page.replace('{{' + k + '}}', v)
    (DIST / 'guias' / g['file']).write_text(page, encoding='utf-8')
    idx.append({
        **{k: g[k] for k in ['id', 'slug', 'file', 'legacyFile', 'href', 'tag', 'category', 'subcategory', 'date', 'titles', 'descs', 'keywords']},
        'link': 'guias/' + g['file']
    })

# Keep old URLs working, but make them redirects rather than duplicate content.
for g in idx:
    legacy = g.get('legacyFile')
    if not legacy or legacy == g['file']:
        continue
    legacy_path = DIST / 'guias' / legacy
    # Encode the canonical filename in the relative redirect URL.
    from urllib.parse import quote
    canonical_rel = quote(g['file'], safe='.-_')
    legacy_path.write_text(
        '<!doctype html><html lang="es"><head>'
        '<meta charset="utf-8">'
        '<meta name="robots" content="noindex,follow">'
        f'<meta name="legacy-redirect" content="{html.escape(g["file"], quote=True)}">'
        f'<link rel="canonical" href="{BASE}guias/{quote(g["file"], safe=".-_")}">'
        f'<meta http-equiv="refresh" content="0; url={canonical_rel}">'
        f'<title>Redirigiendo… | La Presa</title>'
        f'<script>location.replace("{canonical_rel}");</script>'
        '</head><body>'
        f'<p>Esta guía se ha movido. <a href="{canonical_rel}">Continuar</a>.</p>'
        '</body></html>',
        encoding='utf-8'
    )

(DIST / 'guias' / 'guide-index.json').write_text(json.dumps(idx, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
search_idx = [
    {
        'id': x['id'], 'slug': x['slug'],
        'title': x['titles'].get('es') or x['titles'].get('en') or x['file'].removesuffix('.html'),
        'description': x['descs'].get('es') or x['descs'].get('en') or '',
        'tag': x['tag'], 'category': x['category'], 'subcategory': x['subcategory'],
        'date': x['date'], 'keywords': x['keywords'], 'link': x['link']
    }
    for x in idx
]
(DIST / 'search-index.json').write_text(json.dumps(search_idx, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'Built {len(idx)} canonical guides + {sum(1 for g in idx if g.get("legacyFile"))} legacy redirects into {DIST}.')
