#!/usr/bin/env python3
"""Rewrite any old/legacy guide URL to the normalized canonical guide URL."""
from pathlib import Path
from urllib.parse import unquote
import json, re, unicodedata

ROOT=Path(__file__).resolve().parents[1]
BASE='https://kelonio-hub.github.io/Archivos-Kelonio/'
data_path=ROOT/'data'/'guides.json'
data=json.loads(data_path.read_text(encoding='utf-8'))

def decode_custom(s):
    return re.sub(r'#U([0-9A-Fa-f]{4,6})', lambda m: chr(int(m.group(1),16)), s)

def slugify(name):
    name=decode_custom(unquote(name))
    name=name.rsplit('/',1)[-1]
    name=re.sub(r'\.html?$', '', name, flags=re.I)
    name=unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode('ascii').lower()
    name=re.sub(r'[^a-z0-9]+','-',name).strip('-')
    return name

canonical={g['slug']:g['file'] for g in data['guides']}
numberless={}
for s,f in canonical.items():
    numberless.setdefault(re.sub(r'-\d+(?=-)', '', s), f)
pat=re.compile(r'(?P<prefix>(?:https://kelonio-hub\.github\.io/Archivos-Kelonio/)?guias/)(?P<name>[^\"\'<>\s?#]+(?:%20|\s)[^\"\'<>\s?#]+\.html|[^\"\'<>\s?#]+\.html)', re.I)

def repl(m):
    name=m.group('name')
    slug=slugify(name)
    file=canonical.get(slug)
    if not file:
        # Some old cross-links omitted a numeric prefix used by the legacy filename.
        parts=slug.split('-')
        if len(parts) >= 3 and parts[1].isdigit():
            file=canonical.get(parts[0]+'-'+'-'.join(parts[2:]))
    if not file:
        file=numberless.get(slug)
    if not file:
        return m.group(0)
    prefix=m.group('prefix')
    if prefix.startswith('http'):
        return BASE+'guias/'+file
    return prefix+file

changed_src=0
for p in (ROOT/'src'/'guides').glob('*.html'):
    t=p.read_text(encoding='utf-8')
    nt=pat.sub(repl,t)
    if nt!=t:
        p.write_text(nt,encoding='utf-8'); changed_src+=1

# Normalize the URLs inside structured-data metadata recursively via JSON serialization.
def rewrite_obj(obj):
    if isinstance(obj,str):
        return pat.sub(repl,obj)
    if isinstance(obj,list): return [rewrite_obj(x) for x in obj]
    if isinstance(obj,dict): return {k:rewrite_obj(v) for k,v in obj.items()}
    return obj
for g in data['guides']:
    g['schemaExtras']=rewrite_obj(g.get('schemaExtras',[]))

data_path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Normalized legacy guide refs in {changed_src} source guide fragments + schema metadata.')
