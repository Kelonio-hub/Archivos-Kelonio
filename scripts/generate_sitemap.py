#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import quote
import json
BASE='https://kelonio-hub.github.io/Archivos-Kelonio/'
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
idx=json.loads((DIST/'guias'/'guide-index.json').read_text(encoding='utf-8'))
urls=[
 ('', 'daily', '1.0'), ('guias.html','daily','0.9'), ('actualizaciones.html','daily','0.9'),
 ('recomendador.html','weekly','0.8'), ('videoteca.html','weekly','0.7'), ('productos.html','weekly','0.6')
]
for g in idx:
    urls.append(('guias/'+g['file'],'monthly','0.7'))
items=[]
for path,change,freq in urls:
    loc=BASE+quote(path, safe='/:?=&')
    items.append(f'  <url><loc>{loc}</loc><changefreq>{change}</changefreq><priority>{freq}</priority></url>')
xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+'\n'.join(items)+'\n</urlset>\n'
(DIST/'sitemap.xml').write_text(xml,encoding='utf-8')
print(f'Generated sitemap with {len(urls)} canonical URLs.')
