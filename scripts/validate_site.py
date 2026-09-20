#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
errors=[]
idx=json.loads((DIST/'guias'/'guide-index.json').read_text(encoding='utf-8'))
canon={g['file'] for g in idx}
if len(canon)!=len(idx): errors.append('Slug/file collision in guide-index.json')
for g in idx:
 p=DIST/'guias'/g['file']
 if not p.exists(): errors.append(f'Missing generated guide: {g["file"]}'); continue
 s=BeautifulSoup(p.read_text(encoding='utf-8',errors='replace'),'html.parser')
 if not s.find('meta',attrs={'name':'description'}): errors.append(f'No description: {g["file"]}')
 if not s.find('link',attrs={'rel':'canonical'}): errors.append(f'No canonical: {g["file"]}')
 if not s.find('script',attrs={'type':'application/ld+json'}): errors.append(f'No JSON-LD: {g["file"]}')
 if s.find('style'): errors.append(f'Inline <style> remains: {g["file"]}')
 if 'const translations' in p.read_text(encoding='utf-8',errors='replace'): errors.append(f'Inline translations remain: {g["file"]}')
 if re.search(r'#U[0-9A-Fa-f]{4,6}', p.name): errors.append(f'Unnormalized filename: {p.name}')
for legacy in (DIST/'guias').glob('*.html'):
 if legacy.name in canon: continue
 s=BeautifulSoup(legacy.read_text(encoding='utf-8',errors='replace'),'html.parser')
 if s.find('meta',attrs={'name':'legacy-redirect'}) is None: errors.append(f'Unexpected non-canonical HTML: {legacy.name}')
print(f'Checked {len(idx)} canonical guides.')
if errors:
 print('\nERRORS:'); [print('- '+e) for e in errors]
 sys.exit(1)
print('Validation OK.')
