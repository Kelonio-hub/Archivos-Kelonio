(function(){
  "use strict";
  const MAP={
    "SWITCH":{file:"switch.json",label:"Switch",terms:["switch","mando","funda","consola","accesorio","cargador"]},
    "3DS":{file:"3ds.json",label:"3DS / NDS",terms:["3ds","nds","r4","tarjeta","bateria","cargador","pantalla","funda","hardware"]},
    "NDSI":{file:"3ds.json",label:"3DS / NDS",terms:["nds","dsi","r4","tarjeta","bateria","cargador"]},
    "WII":{file:"wii.json",label:"Wii",terms:["wii","mando","sensor","cable","nunchuk","juego"]},
    "WII U":{file:"wii.json",label:"Wii U",terms:["wii u","wiiu","gamepad","mando","cable","juego"]},
    "VWII":{file:"wii.json",label:"Wii / vWii",terms:["wii","mando","sensor","cable","nintendont","usb"]},
    "WII MINI":{file:"wii.json",label:"Wii / Wii Mini",terms:["wii mini","wii","mando","cable","usb","sensor"]},
    "WII / WII MINI / VWII":{file:"wii.json",label:"Wii / vWii / Wii Mini",terms:["wii","mando","cable","usb","sensor"]},
    "SD":{file:"sd_usb.json",label:"SD / USB",terms:["sd","micro sd","usb","disco duro","adaptador","bateria","cable"]}
  };
  const DICT={
    es:{catalog:"Puedes visualizar nuestros",products:"productos",buy:"Ver producto",empty:"No hay productos disponibles"},
    en:{catalog:"You can view our",products:"products",buy:"View product",empty:"No products available"},
    fr:{catalog:"Vous pouvez consulter nos",products:"produits",buy:"Voir le produit",empty:"Aucun produit disponible"},
    de:{catalog:"Sie können unsere",products:"Produkte",buy:"Produkt ansehen",empty:"Keine Produkte verfügbar"},
    it:{catalog:"Puoi visualizzare i nostri",products:"prodotti",buy:"Vedi prodotto",empty:"Nessun prodotto disponibile"},
    pt:{catalog:"Pode visualizar os nossos",products:"produtos",buy:"Ver produto",empty:"Nenhum produto disponível"},
    ja:{catalog:"当社の",products:"製品をご覧いただけます",buy:"商品を見る",empty:"商品がありません"},
    ko:{catalog:"저희",products:"제품을 확인하실 수 있습니다",buy:"제품 보기",empty:"사용 가능한 제품이 없습니다"}
  };
  const CACHE_MS=30*60*1000;
  let cfg,items=[],idx=0,timer=null;
  const meta=document.querySelector('meta[name="guide-tag"]');
  const tag=(meta?.content||"").trim().toUpperCase();
  cfg=MAP[tag]||MAP["SD"];
  const aside=document.getElementById("guideProductsSidebar");
  const card=document.getElementById("guideProductsCard");
  if(!aside||!card)return;
  function lang(){
    const saved=localStorage.getItem("preferredLanguage");
    if(saved&&DICT[saved])return saved;
    const current=(typeof idiomaActual!=="undefined"?idiomaActual:"");
    if(DICT[current])return current;
    const browser=(navigator.language||navigator.userLanguage||"es").split("-")[0].toLowerCase();
    return DICT[browser]?browser:"es";
  }
  function norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function byLang(v,l){return typeof v==="string"?v:(v?.[l]||v?.es||v?.en||Object.values(v||{})[0]||"")}
  function txt(k){return (DICT[lang()]||DICT.es)[k]}
  function setHead(){
    const lead=aside.querySelector("#guideProductsCatalogLead");
    const link=aside.querySelector("#guideProductsCatalogLink");
    if(lead)lead.textContent=txt("catalog");
    if(link){
      link.href="https://kelonio-hub.github.io/Archivos-Kelonio/productos.html";
      const strong=link.querySelector("strong");
      if(strong)strong.textContent=txt("products");
    }
    const pill=aside.querySelector(".guide-products-section-pill");
    if(pill)pill.textContent=cfg.label;
  }
  function url(p){
    try{
      const u=new URL(String(p.url||""),location.href);
      if(!/^https?:$/.test(u.protocol))return "#";
      if(!u.searchParams.has("tag"))u.searchParams.set("tag","kelonio-21");
      return u.href;
    }catch(e){return "#"}
  }
  async function load(){
    const key="kelonio-products:"+cfg.file;
    try{
      const c=JSON.parse(localStorage.getItem(key)||"null");
      if(c&&Array.isArray(c.data)&&Date.now()-c.ts<CACHE_MS)return c.data;
    }catch(e){}
    const r=await fetch("../productos/"+cfg.file+"?v="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw Error("HTTP "+r.status);
    const d=await r.json();
    const list=Array.isArray(d)?d:Object.values(d||{});
    try{localStorage.setItem(key,JSON.stringify({ts:Date.now(),data:list}))}catch(e){}
    return list;
  }
  function choose(list){
    const title=norm(document.querySelector("#txt_title,.guide-header h1")?.textContent||document.title);
    const active=list.filter(p=>!p.status||norm(p.status)==="active");
    const ranked=active.map((p,i)=>{
      const hay=norm([byLang(p.label,lang()),byLang(p.desc,lang()),p.subcategory,p.console].join(" "));
      let s=p.img?1:0;
      cfg.terms.forEach(t=>{
        const q=norm(t);
        if(q&&hay.includes(q))s+=4;
        if(q&&title.includes(q))s+=2;
      });
      return {p,i,s};
    }).sort((a,b)=>b.s-a.s||a.i-b.i);
    const pool=ranked.slice(0,Math.min(36,ranked.length));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    return pool.slice(0,Math.min(8,pool.length)).map(x=>x.p);
  }
  function dots(){
    const d=document.getElementById("guideProductsDots");
    if(!d)return;
    d.innerHTML="";
    items.forEach((_,i)=>{
      const s=document.createElement("span");
      s.className="guide-products-dot"+(i===idx?" active":"");
      d.appendChild(s);
    });
  }
  function fill(p){
    card.innerHTML="";
    const l=lang();
    const affiliate=url(p);

    const media=document.createElement("div");
    media.className="guide-products-media";
    const imageLink=document.createElement("a");
    imageLink.className="guide-products-image-link";
    imageLink.href=affiliate;
    imageLink.target="_blank";
    imageLink.rel="noopener noreferrer sponsored";
    imageLink.setAttribute("aria-label",String(byLang(p.label,l)||"Producto"));

    const img=document.createElement("img");
    img.src=p.img||"../img/Logo Zip.png";
    img.alt=String(byLang(p.label,l)||"Producto");
    img.loading="lazy";
    img.referrerPolicy="no-referrer";
    img.onerror=()=>{if(img.src.endsWith("/Logo%20Zip.png")||img.src.endsWith("/Logo Zip.png"))return;img.src="../img/Logo Zip.png"};
    imageLink.appendChild(img);
    media.appendChild(imageLink);

    const cat=document.createElement("div");
    cat.className="guide-products-category";
    cat.textContent=p.subcategory||"Producto";

    const h=document.createElement("h3");
    h.className="guide-products-title";
    h.textContent=String(byLang(p.label,l)||"Producto recomendado");

    const desc=document.createElement("p");
    desc.className="guide-products-description";
    desc.textContent=String(byLang(p.desc,l)||"").replace(/\s*\n\s*/g," ").replace(/\s*\d+[,.]\d{2}\s*€\s*$/," ").trim();

    const meta=document.createElement("div");
    meta.className="guide-products-meta";
    const a=document.createElement("a");
    a.className="guide-products-button";
    a.href=affiliate;
    a.target="_blank";
    a.rel="noopener noreferrer sponsored";
    a.textContent=txt("buy")+" ↗";
    meta.append(a);

    card.append(media,cat,h,desc,meta);
    card.classList.remove("is-changing");
    dots();
  }
  function render(next){
    if(!items.length)return;
    if(next){
      card.classList.add("is-changing");
      setTimeout(()=>fill(items[idx]),170);
    }else fill(items[idx]);
  }
  function restart(){
    clearInterval(timer);
    const bar=document.getElementById("guideProductsTimer");
    if(bar){
      bar.style.animation="none";
      requestAnimationFrame(()=>bar.style.animation="guideProductsTimer 5s linear infinite");
    }
    timer=setInterval(()=>{
      if(document.hidden||items.length<2)return;
      idx=(idx+1)%items.length;
      render(true);
    },5000);
  }
  function boot(){
    setHead();
    load().then(list=>{
      items=choose(list);
      if(!items.length){card.textContent=txt("empty");return}
      render(false);
      restart();
    }).catch(()=>{card.textContent=txt("empty")});
  }
  document.addEventListener("kelonio:languageChanged",()=>{
    setHead();
    if(items.length)fill(items[idx]);
  });
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden&&items.length>1)restart();
  });
  document.addEventListener("DOMContentLoaded",boot,{once:true});
  window.addEventListener("load",()=>{if(!items.length)setTimeout(()=>boot(),120)},{once:true});
})();
