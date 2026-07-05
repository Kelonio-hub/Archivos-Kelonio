from pathlib import Path
from urllib.parse import quote
import json,re

BASE_URL="https://kelonio-hub.github.io/Archivos-Kelonio/guias/"
guias={}
for f in sorted(Path("guias").glob("*.html")):
    stem=f.stem
    cat,title=(stem.split(" - ",1)+[""])[:2] if " - " in stem else ("",stem)
    cmd=re.sub(r'[^a-z0-9]','',title.lower())
    guias[cmd]={
        "titulo": stem,
        "categoria": cat,
        "url": BASE_URL+quote(f.name),
        "aliases":[cmd]
    }
with open("guias.json","w",encoding="utf8") as fp:
    json.dump(guias,fp,ensure_ascii=False,indent=2)
print(f"Generadas {len(guias)} guías")
