#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
idx=json.loads((ROOT/'guias'/'guide-index.json').read_text(encoding='utf-8'))
canon={g['file'] for g in idx}
if len(canon)!=len(idx): errors.append('Slug/file collision in guide-index.json')
for g in idx:
 p=ROOT/'guias'/g['file']
 if not p.exists(): errors.append(f'Missing generated guide: {g["file"]}'); continue
 s=BeautifulSoup(p.read_text(encoding='utf-8',errors='replace'),'html.parser')
 if not s.find('meta',attrs={'name':'description'}): errors.append(f'No description: {g["file"]}')
 if not s.find('link',attrs={'rel':'canonical'}): errors.append(f'No canonical: {g["file"]}')
 if not s.find('script',attrs={'type':'application/ld+json'}): errors.append(f'No JSON-LD: {g["file"]}')
 if s.find('style'): errors.append(f'Inline <style> remains: {g["file"]}')
 if 'const translations' in p.read_text(encoding='utf-8',errors='replace'): errors.append(f'Inline translations remain: {g["file"]}')
 if re.search(r'#U[0-9A-Fa-f]{4,6}',p.name): errors.append(f'Unnormalized filename: {p.name}')
 # local hrefs in canonical guides
 for el in s.find_all(['a','link','script','img'], href=True):
  val=el.get('href')
  if isinstance(val,str) and val.startswith(('../','./')):
   target=(p.parent/val).resolve() if val.startswith('../') else (p.parent/val).resolve()
   target_path=Path(str(target).split('#')[0].split('?')[0])
   if not target_path.exists() and target_path.suffix not in {'.html','.js','.css','.json','.gif','.png','.jpg','.jpeg','.webp','.svg','.ico'}: pass
 # images/scripts with src
 for el in s.find_all(src=True):
  val=el.get('src');
  if isinstance(val,str) and val.startswith('../'):
   target=(p.parent/val.split('?')[0]).resolve()
   if not target.exists(): errors.append(f'Broken asset {val} in {g["file"]}')
print(f'Checked {len(idx)} guides.')
if errors:
 print('\nERRORS:'); [print('- '+e) for e in errors]
 sys.exit(1)
print('Validation OK.')
