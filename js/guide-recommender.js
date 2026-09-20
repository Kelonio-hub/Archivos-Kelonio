(() => {
  'use strict';
  let guides=[]; let platform=''; let intent='';
  const platformChoices=[['3DS','Nintendo 3DS'],['SWITCH','Nintendo Switch'],['WII','Nintendo Wii'],['WII U','Nintendo Wii U'],['WII MINI','Wii Mini'],['VWII','vWii'],['NDSI','Nintendo DS / DSi'],['SD','Tarjetas SD / utilidades']];
  const intents=[
    ['repair','Tengo un error / no arranca',['brick','arranque','error','crash','pantalla','recover','repar','nand','ctrnand','semibrick']],
    ['hack','Quiero modificar / instalar CFW',['hack','cfw','luma','mocha','tiramisu','haxchi','homebrew']],
    ['apps','Quiero instalar o usar una herramienta',['fbi','checkpoint','godmode9','retroarch','usbloader','nusspli','tesla','app','tool']],
    ['files','Necesito convertir, preparar o gestionar archivos',['convert','cia','3dsx','nds','nand','sd','dump','trim']],
    ['setup','Quiero configurar o actualizar',['update','actualizar','config','cios','firmware','kernel','region']]
  ];
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  const score=(g,q)=>{
    const blob=norm([g.tag,g.titles?.es,g.titles?.en,g.descs?.es,(g.keywords||[]).join(' '),g.legacyFile].join(' '));
    let s=0; q.forEach(t=>{const z=norm(t);if(!z)return;if(blob.includes(z))s+=blob.includes(norm(g.titles?.es))&&norm(g.titles?.es).includes(z)?4:2}); return s;
  };
  function renderChoices(){
    const p=document.getElementById('platformChoices'); p.innerHTML='';
    platformChoices.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='choice-btn';b.textContent=label;b.addEventListener('click',()=>{platform=id;document.querySelectorAll('#platformChoices .choice-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');});p.appendChild(b)});
    const i=document.getElementById('intentChoices'); i.innerHTML='';
    intents.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='choice-btn';b.textContent=label;b.dataset.intent=id;b.addEventListener('click',()=>{intent=id;document.querySelectorAll('#intentChoices .choice-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');});i.appendChild(b)});
  }
  function find(){
    const q=norm(document.getElementById('problemText').value); const rule=intents.find(x=>x[0]===intent); const terms=[...((rule&&rule[2])||[]),...q.split(/\s+/).filter(x=>x.length>2)];
    let pool=guides.filter(g=>!platform || norm(g.category)===norm(platform));
    if(!pool.length)pool=guides.slice();
    const ranked=pool.map(g=>({g,s:score(g,terms)})).sort((a,b)=>b.s-a.s||String(b.g.date).localeCompare(String(a.g.date))).filter(x=>x.s>0).slice(0,8);
    const out=document.getElementById('results');
    if(!ranked.length){out.innerHTML='<p class="result-summary">No he encontrado una coincidencia clara. Prueba a describir el error con más detalle.</p>';return;}
    out.innerHTML='<p class="result-summary">He encontrado estas guías relacionadas. Son recomendaciones por coincidencia de contenido, no un diagnóstico automático.</p>'+ranked.map(({g,s})=>`<article class="guide-result"><div><h3>${esc(g.titles?.es||g.file)}</h3><p>${esc(g.descs?.es||'')} · ${esc(g.category||g.tag||'')}</p></div><a href="guias/${esc(g.file)}">Abrir guía</a></article>`).join('');
  }
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  async function init(){
    try{guides=await (await fetch('guias/guide-index.json',{cache:'force-cache'})).json();}catch{document.getElementById('results').textContent='No se pudo cargar el índice de guías.';return;}
    renderChoices();document.getElementById('findGuides').addEventListener('click',find);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
