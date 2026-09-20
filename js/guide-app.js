(() => {
  'use strict';
  const LANGS=['es','en','fr','de','it','pt','ja','ko'];
  const LANG_NAMES={es:'Español',en:'English',fr:'Français',de:'Deutsch',it:'Italiano',pt:'Português',ja:'日本語',ko:'한국어'};
  const GUIDE_ID=String(window.KELONIO_GUIDE_ID||document.documentElement.dataset.guideId||'');
  let idiomaActual='es';
  let guideData=null;
  let allGuides=[];

  const palette={rojo:['#e50914','229, 9, 20'],naranja:['#ff6600','255, 102, 0'],amarillo:['#ffcc00','255, 204, 0'],verde:['#2ecc71','46, 204, 113'],azul:['#00aaff','0, 170, 255'],violeta:['#9b59b6','155, 89, 182'],rosa:['#ff80ab','255, 128, 171']};
  const ICONS={'SWITCH':'../img/Logo Switch.png','3DS':'../img/Logo 3DS.png','NDSI':'../img/Logo NDS.png','NDS':'../img/Logo NDS.png','WII':'../img/Logo Wii.png','WII MINI':'../img/Logo Mini.png','WII U':'../img/Logo WiiU.png','VWII':'../img/Logo vWii.png','SONY':'https://api.iconify.design/ri:playstation-line.svg?color=%23ffffff','XBOX':'https://api.iconify.design/ri:xbox-line.svg?color=%23ffffff','SD':'../img/Logo SD.png'};
  const CATEGORY_ORDER=['SWITCH','3DS','NDSI','WII','WII MINI','WII U','VWII','SONY','XBOX','SD'];

  const getLang=()=>{
    const q=new URLSearchParams(location.search).get('lang');
    if(q&&LANGS.includes(q))return q;
    const saved=localStorage.getItem('kelonio.language');
    if(saved&&LANGS.includes(saved))return saved;
    const nav=(navigator.language||'es').split('-')[0].toLowerCase();
    return LANGS.includes(nav)?nav:'es';
  };
  const t=()=> (guideData?.translations?.[idiomaActual] || guideData?.translations?.en || {});
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function applyTheme(name){
    const p=palette[name]||palette.azul;
    document.documentElement.style.setProperty('--red',p[0]);
    document.documentElement.style.setProperty('--glow-rgb',p[1]);
    localStorage.setItem('selectedThemeColor',name);
  }
  function initThemeDots(){
    const box=document.getElementById('themeDots'); if(!box)return;
    box.innerHTML=''; const saved=localStorage.getItem('selectedThemeColor')||'azul'; const mode=localStorage.getItem('selectedMode')||'dark';
    Object.entries(palette).forEach(([name,p])=>{
      const b=document.createElement('button'); b.type='button'; b.className='color-dot'; b.title=name; b.setAttribute('aria-label',`Color ${name}`); b.style.backgroundColor=p[0]; if(name===saved)b.classList.add('active-dot');
      b.addEventListener('click',()=>{document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('active-dot'));b.classList.add('active-dot');applyTheme(name);}); box.appendChild(b);
    });
    const sep=document.createElement('span'); sep.className='theme-separator'; box.appendChild(sep);
    [['dark','#141414','Forzar modo oscuro'],['light','#f8f9fa','Forzar modo claro']].forEach(([m,c,label])=>{
      const b=document.createElement('button'); b.type='button'; b.className='color-dot mode-dot'; b.style.backgroundColor=c; b.title=label; b.setAttribute('aria-label',label); if(mode===m)b.classList.add('active-dot');
      b.addEventListener('click',()=>{document.querySelectorAll('.mode-dot').forEach(x=>x.classList.remove('active-dot'));b.classList.add('active-dot');localStorage.setItem('selectedMode',m);document.documentElement.setAttribute('data-theme',m);}); box.appendChild(b);
    });
    document.documentElement.setAttribute('data-theme',mode); applyTheme(saved);
  }
  function initLanguageSelector(){
    const sel=document.getElementById('languageSelector'); if(!sel)return;
    sel.innerHTML=''; LANGS.forEach(l=>{const o=document.createElement('option');o.value=l;o.textContent=LANG_NAMES[l];o.selected=l===idiomaActual;sel.appendChild(o);});
    sel.addEventListener('change',()=>setLanguage(sel.value));
  }
  function setLanguage(lang){
    if(!LANGS.includes(lang))lang='es';
    idiomaActual=lang; window.idiomaActual=lang; localStorage.setItem('kelonio.language',lang); document.documentElement.lang=lang;
    applyTranslations(); renderSidebar();
    document.dispatchEvent(new CustomEvent('kelonio:languageChanged',{detail:{lang}}));
  }
  function setById(id,value){
    if(!id||value==null)return;
    const nodes=document.querySelectorAll('#'+CSS.escape(id)); if(!nodes.length)return;
    nodes.forEach(el=>{
      if(el instanceof HTMLInputElement && (el.type==='number'||el.type==='text')){el.placeholder=String(value); if(id.includes('download'))el.value=String(value);return;}
      if(el instanceof HTMLOptionElement){el.textContent=String(value);return;}
      el.innerHTML=String(value);
    });
  }
  const KEY_TARGETS={pp_title_text:'pp-title',pp_subtitle_text:'pp-subtitle',pp_free_text:'pp-free',pp_other_text:'pp-other-amount',pp_placeholder_text:'pp-custom-amount',pp_download_text:'pp-download-btn',pp_success_text:'pp-success-msg'};
  function applyTranslations(){
    const tr=t();
    Object.entries(tr).forEach(([k,v])=>{
      if(KEY_TARGETS[k]){
        const id=KEY_TARGETS[k], el=document.getElementById(id); if(!el)return;
        if(k==='pp_placeholder_text')el.setAttribute('placeholder',String(v));
        else if(el instanceof HTMLInputElement)el.value=String(v);
        else el.innerHTML=String(v);
        return;
      }
      setById(k,v);
    });
    const esTitle=guideData?.titles?.es || tr.txt_title || 'Guía';
    const currentTitle=(guideData?.titles?.[idiomaActual]||esTitle);
    document.title=currentTitle+' | La Presa';
    const desc=guideData?.descs?.[idiomaActual]||guideData?.descs?.es||'';
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=desc;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content',desc);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content',document.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content',desc);
    document.getElementById('assistantBtn')?.setAttribute('aria-label',tr.assistant||'Asistente de guías');
    document.getElementById('radarBtn')?.setAttribute('aria-label',tr.txt_radar||'Radar de Actualizaciones');
    document.getElementById('radarBtn')?.setAttribute('title',tr.txt_radar||'Radar de Actualizaciones');
    const selector=document.getElementById('languageSelector');if(selector)selector.value=idiomaActual;
    if(window.youtubeAuthRefreshLanguage)window.youtubeAuthRefreshLanguage();
  }
  async function loadIndex(){
    const res=await fetch('guide-index.json',{cache:'no-store'}); if(!res.ok)throw new Error(`guide-index ${res.status}`); allGuides=await res.json(); return allGuides;
  }
  function renderSidebar(data=allGuides){
    const sidebar=document.getElementById('guideSidebar'); if(!sidebar)return;
    const tr=t(); const groups={};
    data.forEach(g=>{const cat=String(g.category||g.tag||'INFO').toUpperCase();(groups[cat]??=[]).push(g)});
    const current=(location.pathname.split('/').pop()||'').toLowerCase();
    let html=`<button class="mobile-sidebar-toggle" id="mobileSidebarToggle" type="button" aria-expanded="false">☰ <span>${esc(tr.txt_guides||'Guías')}</span></button>`;
    html+=`<div class="sidebar-title" id="txt_otherGuides">${esc(tr.txt_otherGuides||'Otras Guías')}</div>`;
    const renderGroup=(cat,list)=>{
      list.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.titles?.es||'').localeCompare(String(b.titles?.es||'')));
      const open=list.some(g=>g.file===current||g.slug===current.replace(/\.html$/,''));
      html+=`<div class="sidebar-group${open?'':' collapsed'}"><button class="sidebar-category" type="button" aria-expanded="${open?'true':'false'}"><span class="cat-left"><img src="${esc(ICONS[cat]||'../img/Logo Zip.png')}" alt="" loading="lazy">${esc(cat)}</span><span class="toggle-icon">▼</span></button><div class="sidebar-links-container">`;
      list.forEach(g=>{
        const active=(g.file===current)?' active':''; const title=g.titles?.[idiomaActual]||g.titles?.en||g.titles?.es||g.file;
        html+=`<a href="${esc(g.href||g.file)}" class="sidebar-link${active}"><img src="${esc(ICONS[cat]||'../img/Logo Zip.png')}" alt="" loading="lazy"><span>${esc(title)}</span></a>`;
      });
      html+='</div></div>';
    };
    CATEGORY_ORDER.forEach(cat=>{if(groups[cat]){renderGroup(cat,groups[cat]);delete groups[cat]}}); Object.keys(groups).sort().forEach(cat=>renderGroup(cat,groups[cat]));
    sidebar.innerHTML=html;
    sidebar.querySelectorAll('.sidebar-category').forEach(btn=>btn.addEventListener('click',()=>{const group=btn.closest('.sidebar-group');const open=!group.classList.toggle('collapsed');btn.setAttribute('aria-expanded',String(open));}));
    sidebar.querySelector('#mobileSidebarToggle')?.addEventListener('click',()=>{
      const open=sidebar.classList.contains('mobile-open'); sidebar.classList.toggle('mobile-open',!open); sidebar.classList.toggle('mobile-hidden',open); sidebar.querySelector('#mobileSidebarToggle')?.setAttribute('aria-expanded',String(!open));
    });
  }
  async function initSidebar(){
    const cached=localStorage.getItem('kelonio.guideIndex.v2');
    if(cached){try{allGuides=JSON.parse(cached);renderSidebar();}catch{localStorage.removeItem('kelonio.guideIndex.v2')}}
    try{const fresh=await loadIndex(); const s=JSON.stringify(fresh); if(s!==cached && cached){const banner=document.createElement('div');banner.className='guide-update-banner';banner.textContent=(t().txt_updateNotice||'✨ Hay nuevas guías disponibles')+' — '+(t().txt_updateClick||'Pulsa para actualizar');banner.tabIndex=0;banner.addEventListener('click',()=>{renderSidebar(fresh);banner.remove()});document.getElementById('guideSidebar')?.prepend(banner);} localStorage.setItem('kelonio.guideIndex.v2',s); renderSidebar(fresh);}catch(e){console.warn('No se pudo cargar guide-index.json',e)}
  }
  function initBackTop(){const b=document.getElementById('backToTopBtn');if(!b)return; const sync=()=>{b.style.display=scrollY>320?'block':'none'};addEventListener('scroll',sync,{passive:true});b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));sync()}
  async function init(){
    idiomaActual=getLang(); window.idiomaActual=idiomaActual;
    try{
      const res=await fetch(`../data/guides.json`,{cache:'force-cache'}); if(!res.ok)throw new Error('guide data unavailable');
      const all=await res.json(); const current=all.guides?.find(g=>g.id===GUIDE_ID||g.slug===GUIDE_ID); if(!current) throw new Error('Guide not found: '+GUIDE_ID); guideData={...current,translations:all.translations?.[GUIDE_ID]||{}};
    }catch(e){console.warn(e)}
    initLanguageSelector();initThemeDots();applyTranslations();initBackTop();
    initSidebar();
    document.getElementById('mainHub')?.classList.add('is-ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.setKelonioGuideLanguage=setLanguage;
})();
