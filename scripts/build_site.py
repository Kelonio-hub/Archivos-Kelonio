#!/usr/bin/env python3
"""Build/rebuild canonical guide pages from src/guides + data/guides.json.
Generated files in guias/*.html are outputs; edit src/guides/*.html and data/guides.json instead.
"""
from pathlib import Path
import json, html, re
ROOT=Path(__file__).resolve().parents[1]
BASE='https://kelonio-hub.github.io/Archivos-Kelonio/'

data=json.loads((ROOT/'data'/'guides.json').read_text(encoding='utf-8'))
template=(ROOT/'src'/'templates'/'guide.html').read_text(encoding='utf-8')
header=(ROOT/'src'/'templates'/'header.html').read_text(encoding='utf-8').strip()

def meta_tags(prefix,m):
    return '\n  '.join(f'<meta name="{prefix}-{l}" content="{html.escape(str(m.get(l,"")),quote=True)}">' for l in data['languages'])

def schema_for(g):
    canonical=BASE+'guias/'+g['file']; title=g['titles'].get('es') or g['titles'].get('en') or g['file']; desc=g['descs'].get('es') or g['descs'].get('en') or ''
    graph=[{'@type':'Organization','@id':BASE+'#organization','name':'La Presa','url':BASE,'logo':{'@type':'ImageObject','url':BASE+'img/Lucario.gif'}},{'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':title+' | La Presa','description':desc,'inLanguage':'es','isPartOf':{'@id':BASE+'#website'}},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Inicio','item':BASE},{'@type':'ListItem','position':2,'name':'Guías','item':BASE+'guias.html'},{'@type':'ListItem','position':3,'name':title,'item':canonical}]}]
    graph += g.get('schemaExtras',[])
    return '\n'.join('<script type="application/ld+json">'+json.dumps(x,ensure_ascii=False,indent=2)+'</script>' for x in graph if isinstance(x,dict))

idx=[]
for g in sorted(data['guides'], key=lambda x:(x.get('date') or '',x['slug']), reverse=True):
    content=(ROOT/'src'/'guides'/(g['slug']+'.html')).read_text(encoding='utf-8')
    canonical=BASE+'guias/'+g['file']; title=g['titles'].get('es') or g['titles'].get('en') or g['file'].removesuffix('.html'); desc=g['descs'].get('es') or g['descs'].get('en') or ''
    hreflang='\n  '.join(f'<link rel="alternate" hreflang="{l}" href="{canonical}?lang={l}">' for l in data['languages'])+f'\n  <link rel="alternate" hreflang="x-default" href="{canonical}?lang=en">'
    over=f'<link rel="stylesheet" href="../assets/guide-overrides/{g["styleOverride"]}">' if g.get('styleOverride') else ''
    paypal='<script src="../js/guide-paypal.js" defer></script>' if ('paypal-support-widget' in content or 'paypal-button-container' in content) else ''
    page=template
    vals={'GUIDE_ID':g['id'],'GUIDE_ID_JSON':json.dumps(g['id']),'TITLE_ES':html.escape(title,quote=True),'DESC_ES':html.escape(desc,quote=True),'TAG':html.escape(g['tag'],quote=True),'DATE':html.escape(g['date'],quote=True),'CANONICAL':canonical,'OG_IMAGE':BASE+'img/Logo%20Zip.png','GUIDE_TITLE_METAS':meta_tags('guide-title',g['titles']),'GUIDE_DESC_METAS':meta_tags('guide-desc',g['descs']),'HREFLANG':hreflang,'OVERRIDE_CSS':over,'SCHEMA':schema_for(g),'HEADER':header,'CONTENT':content,'PAYPAL_JS':paypal}
    for k,v in vals.items(): page=page.replace('{{'+k+'}}',v)
    (ROOT/'guias'/g['file']).write_text(page,encoding='utf-8')
    idx.append({**{k:g[k] for k in ['id','slug','file','legacyFile','href','tag','category','subcategory','date','titles','descs','keywords']},'link':'guias/'+g['file']})
(ROOT/'guias'/'guide-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'data'/'guide-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
search_idx=[{'id':x['id'],'slug':x['slug'],'title':x['titles'].get('es') or x['titles'].get('en') or x['file'].removesuffix('.html'),'description':x['descs'].get('es') or x['descs'].get('en') or '','tag':x['tag'],'category':x['category'],'subcategory':x['subcategory'],'date':x['date'],'keywords':x['keywords'],'link':x['link']} for x in idx]
(ROOT/'search-index.json').write_text(json.dumps(search_idx,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Built {len(idx)} canonical guides and synchronized indexes.')
