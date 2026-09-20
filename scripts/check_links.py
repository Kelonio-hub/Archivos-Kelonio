#!/usr/bin/env python3
"""Check local links/assets in public HTML pages.

Legacy guide aliases are intentionally excluded: they are compatibility redirects.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
import json, re
ROOT=Path(__file__).resolve().parents[1]
root_pages=[ROOT/x for x in ['index.html','guias.html','actualizaciones.html','recomendador.html','videoteca.html','productos.html','404.html']]
idx={x['file'] for x in json.loads((ROOT/'guias'/'guide-index.json').read_text(encoding='utf-8'))}
guide_pages=[ROOT/'guias'/x for x in sorted(idx)]
files=root_pages+guide_pages
pat=re.compile(r'(?i)\b(?:href|src)\s*=\s*["\']([^"\']+)["\']')
errors=[]; checked=0
for page in files:
    text=page.read_text(encoding='utf-8',errors='ignore')
    for ref in pat.findall(text):
        ref=ref.strip()
        if '${' in ref:
            continue
        u=urlparse(ref)
        if u.scheme or u.netloc or ref.startswith(('#','data:','mailto:','javascript:')):
            continue
        path=unquote(u.path)
        if not path: continue
        target=(page.parent/path).resolve() if not path.startswith('/') else (ROOT/path.lstrip('/')).resolve()
        checked+=1
        try: inside=target.is_relative_to(ROOT)
        except AttributeError: inside=str(target).startswith(str(ROOT))
        if not inside or not target.exists():
            errors.append((page.relative_to(ROOT),ref,target.relative_to(ROOT) if inside else str(target)))
print(f'Checked {len(files)} HTML pages and {checked} local href/src references.')
if errors:
    print(f'BROKEN: {len(errors)}')
    for page,ref,target in errors[:200]: print(f'- {page}: {ref} -> {target}')
    raise SystemExit(1)
print('All local href/src references resolve.')
