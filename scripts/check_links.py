#!/usr/bin/env python3
"""Check local links/assets in the PUBLIC dist/ artifact."""
from pathlib import Path
from urllib.parse import urlparse, unquote
import json, re
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
root_pages=[DIST/x for x in ['index.html','guias.html','actualizaciones.html','recomendador.html','videoteca.html','productos.html','404.html']]
idx={x['file'] for x in json.loads((DIST/'guias'/'guide-index.json').read_text(encoding='utf-8'))}
files=root_pages+[DIST/'guias'/x for x in sorted(idx)]
pat=re.compile(r'(?i)\b(?:href|src)\s*=\s*["\']([^"\']+)["\']')
errors=[]; checked=0
for page in files:
    text=page.read_text(encoding='utf-8',errors='ignore')
    for ref in pat.findall(text):
        ref=ref.strip()
        if '${' in ref: continue
        u=urlparse(ref)
        if u.scheme or u.netloc or ref.startswith(('#','data:','mailto:','javascript:')): continue
        path=unquote(u.path)
        if not path: continue
        target=(page.parent/path).resolve() if not path.startswith('/') else (DIST/path.lstrip('/')).resolve()
        checked+=1
        try: inside=target.is_relative_to(DIST)
        except AttributeError: inside=str(target).startswith(str(DIST))
        if not inside or not target.exists():
            errors.append((page.relative_to(DIST),ref))
print(f'Checked {len(files)} canonical HTML pages and {checked} local href/src references.')
if errors:
    print(f'BROKEN: {len(errors)}')
    for page,ref in errors[:200]: print(f'- {page}: {ref}')
    raise SystemExit(1)
print('All public local href/src references resolve.')
