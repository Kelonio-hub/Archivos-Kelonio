const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();

const radarDir = __dirname;
const guideIndexPath = path.join(radarDir, '..', 'guias', 'guide-index.json');
const guideIndex = JSON.parse(fs.readFileSync(guideIndexPath, 'utf8'));

function norm(v='') {
  return String(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
}
function relatedGuides(feedTag, title) {
  const text = norm(`${feedTag} ${title}`);
  const terms = text.split(/[^a-z0-9]+/).filter(x=>x.length>=3);
  return guideIndex.map(g=>{
    const blob = norm([g.category,g.tag,g.titles?.es,g.titles?.en,(g.keywords||[]).join(' '),g.legacyFile].join(' '));
    let score=0;
    for (const term of terms) {
      if (blob.includes(term)) score += term.length >= 6 ? 2 : 1;
    }
    if (norm(g.category) === norm(String(feedTag).split('/')[0].trim())) score += 2;
    return {score, guide:{slug:g.slug,title:g.titles?.es||g.file,category:g.category}};
  }).filter(x=>x.score>1).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.guide);
}

async function updateRadar() {
  const programas = JSON.parse(fs.readFileSync(path.join(radarDir, 'radares.json'), 'utf8'));
  const allUpdates = [];
  console.log(`📡 Buscando actualizaciones para ${programas.length} programas...`);

  for (const prog of programas) {
    try {
      const feed = await parser.parseURL(prog.url);
      const latest = feed.items?.[0];
      if (!latest) continue;
      allUpdates.push({
        tag: prog.tag,
        title: latest.title || prog.tag,
        link: latest.link || prog.url,
        date: latest.isoDate || latest.pubDate,
        sourceUrl: prog.url,
        sourceType: 'release-feed',
        relatedGuides: relatedGuides(prog.tag, latest.title || '')
      });
      console.log(`✅ ${prog.tag} -> ${latest.title}`);
    } catch (err) {
      console.error(`❌ ${prog.tag} (${prog.url}):`, err.message);
    }
  }

  allUpdates.sort((a,b)=>new Date(b.date)-new Date(a.date));
  fs.writeFileSync(path.join(radarDir,'ultimas_noticias.json'), JSON.stringify(allUpdates,null,2)+'\n');
  console.log(`🎉 Radar actualizado: ${allUpdates.length} fuentes.`);
}

updateRadar().catch(err=>{ console.error(err); process.exit(1); });
