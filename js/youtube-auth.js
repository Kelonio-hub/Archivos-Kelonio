/* Kelonio — Muro de acceso por suscripción a YouTube
 *
 * La guía queda bloqueada hasta que la cuenta de YouTube autenticada
 * esté suscrita al canal configurado. Se usa Google Identity Services
 * + YouTube Data API, sin bots ni automatización de la interfaz de YouTube.
 */
(function(){
  'use strict';
  if (window.__kelonioYoutubeWallLoaded) return;
  window.__kelonioYoutubeWallLoaded = true;

  const C = window.KELONIO_YOUTUBE_CONFIG || {};
  const CLIENT_ID = String(C.clientId || '');
  const CHANNEL_ID = String(C.channelId || '');
  const CHANNEL_URL = String(C.channelUrl || 'https://www.youtube.com/');
  const JOIN_URL = String(C.joinUrl || (CHANNEL_URL.replace(/\/$/, '') + '/join'));
  const YT_SCOPE = 'https://www.googleapis.com/auth/youtube';
  const API = 'https://www.googleapis.com/youtube/v3';
  const CONFIG_OK = /^\d[\w-]*\.apps\.googleusercontent\.com$/.test(CLIENT_ID) && !CLIENT_ID.startsWith('PON_AQUI');

  const DICT = {
    es:{title:'Acceso a la guía',lead:'Para continuar, suscríbete al canal de Kelonio en YouTube.',detail:'La suscripción se comprueba con tu cuenta de Google y, una vez verificada, tendrás acceso a la guía.',subscribe:'Suscribirme con Google',checking:'Comprobando tu suscripción…',subscribing:'Suscribiendo…',subscribed:'Suscripción verificada ✓',success:'Suscripción verificada. Abriendo la guía…',auth:'Necesitamos autorización de YouTube para comprobar tu suscripción.',needConfig:'El acceso por suscripción necesita configurar el Client ID de Google.',error:'No se ha podido verificar la suscripción. Inténtalo de nuevo.',openYoutube:'Abrir YouTube',member:'Hacerse miembro',memberAria:'Hacerse miembro del canal de YouTube',subscribeAria:'Suscribirme al canal de YouTube con mi cuenta de Google'},
    en:{title:'Guide access',lead:'To continue, subscribe to the Kelonio channel on YouTube.',detail:'Your subscription is checked with your Google account. Once verified, you will have access to the guide.',subscribe:'Subscribe with Google',checking:'Checking your subscription…',subscribing:'Subscribing…',subscribed:'Subscription verified ✓',success:'Subscription verified. Opening the guide…',auth:'YouTube authorization is needed to check your subscription.',needConfig:'Subscription access requires the Google Client ID to be configured.',error:'The subscription could not be verified. Please try again.',openYoutube:'Open YouTube',member:'Join',memberAria:'Join the YouTube channel',subscribeAria:'Subscribe to the YouTube channel with my Google account'},
    fr:{title:'Accès au guide',lead:'Pour continuer, abonnez-vous à la chaîne Kelonio sur YouTube.',detail:'Votre abonnement est vérifié avec votre compte Google. Une fois vérifié, vous aurez accès au guide.',subscribe:"M'abonner avec Google",checking:'Vérification de votre abonnement…',subscribing:'Abonnement en cours…',subscribed:'Abonnement vérifié ✓',success:'Abonnement vérifié. Ouverture du guide…',auth:"Une autorisation YouTube est nécessaire pour vérifier votre abonnement.",needConfig:"L'accès par abonnement nécessite de configurer le Client ID Google.",error:"Impossible de vérifier l'abonnement. Réessayez.",openYoutube:'Ouvrir YouTube',member:'Devenir membre',memberAria:'Devenir membre de la chaîne YouTube',subscribeAria:'S’abonner à la chaîne YouTube avec mon compte Google'},
    de:{title:'Zugriff auf die Anleitung',lead:'Um fortzufahren, abonniere den Kelonio-Kanal auf YouTube.',detail:'Dein Abonnement wird mit deinem Google-Konto geprüft. Nach der Bestätigung erhältst du Zugriff auf die Anleitung.',subscribe:'Mit Google abonnieren',checking:'Abonnement wird geprüft…',subscribing:'Abonnement wird durchgeführt…',subscribed:'Abonnement bestätigt ✓',success:'Abonnement bestätigt. Anleitung wird geöffnet…',auth:'Zur Prüfung deines Abonnements ist eine YouTube-Autorisierung erforderlich.',needConfig:'Für den Zugriff per Abonnement muss die Google Client-ID konfiguriert werden.',error:'Das Abonnement konnte nicht überprüft werden. Bitte erneut versuchen.',openYoutube:'YouTube öffnen',member:'Mitglied werden',memberAria:'Mitglied des YouTube-Kanals werden',subscribeAria:'Den YouTube-Kanal mit meinem Google-Konto abonnieren'},
    it:{title:'Accesso alla guida',lead:'Per continuare, iscriviti al canale Kelonio su YouTube.',detail:'La tua iscrizione viene verificata con il tuo account Google. Dopo la verifica avrai accesso alla guida.',subscribe:'Iscriviti con Google',checking:'Controllo dell’iscrizione…',subscribing:'Iscrizione in corso…',subscribed:'Iscrizione verificata ✓',success:'Iscrizione verificata. Apertura della guida…',auth:'È necessaria l’autorizzazione di YouTube per verificare la tua iscrizione.',needConfig:'Per l’accesso tramite iscrizione è necessario configurare il Client ID Google.',error:'Non è stato possibile verificare l’iscrizione. Riprova.',openYoutube:'Apri YouTube',member:'Diventa membro',memberAria:'Diventa membro del canale YouTube',subscribeAria:'Iscriviti al canale YouTube con il mio account Google'},
    pt:{title:'Acesso ao guia',lead:'Para continuar, subscreva o canal Kelonio no YouTube.',detail:'A sua subscrição é verificada com a sua conta Google. Depois de verificada, terá acesso ao guia.',subscribe:'Subscrever com Google',checking:'A verificar a subscrição…',subscribing:'A subscrever…',subscribed:'Subscrição verificada ✓',success:'Subscrição verificada. A abrir o guia…',auth:'É necessária autorização do YouTube para verificar a sua subscrição.',needConfig:'O acesso por subscrição requer a configuração do Client ID da Google.',error:'Não foi possível verificar a subscrição. Tente novamente.',openYoutube:'Abrir o YouTube',member:'Tornar-se membro',memberAria:'Tornar-se membro do canal do YouTube',subscribeAria:'Subscrever o canal do YouTube com a minha conta Google'},
    ja:{title:'ガイドへのアクセス',lead:'続行するには、YouTube の Kelonio チャンネルに登録してください。',detail:'Google アカウントでチャンネル登録を確認します。確認が完了すると、このガイドにアクセスできます。',subscribe:'Google でチャンネル登録',checking:'登録状況を確認中…',subscribing:'チャンネル登録中…',subscribed:'登録を確認しました ✓',success:'登録を確認しました。ガイドを開きます…',auth:'登録状況を確認するには YouTube の認証が必要です。',needConfig:'登録によるアクセスには Google Client ID の設定が必要です。',error:'登録状況を確認できませんでした。もう一度お試しください。',openYoutube:'YouTube を開く',member:'メンバーになる',memberAria:'YouTube チャンネルのメンバーになる',subscribeAria:'Google アカウントで YouTube チャンネルに登録'},
    ko:{title:'가이드 이용',lead:'계속하려면 YouTube에서 Kelonio 채널을 구독하세요.',detail:'Google 계정으로 구독 여부를 확인합니다. 확인되면 가이드에 접근할 수 있습니다.',subscribe:'Google로 구독하기',checking:'구독 확인 중…',subscribing:'구독하는 중…',subscribed:'구독 확인 완료 ✓',success:'구독이 확인되었습니다. 가이드를 엽니다…',auth:'구독 여부를 확인하려면 YouTube 인증이 필요합니다.',needConfig:'구독을 통한 접근을 사용하려면 Google Client ID 설정이 필요합니다.',error:'구독을 확인할 수 없습니다. 다시 시도해 주세요.',openYoutube:'YouTube 열기',member:'멤버 되기',memberAria:'YouTube 채널 멤버 되기',subscribeAria:'Google 계정으로 YouTube 채널 구독'}
  };

  let tokenClient = null;
  let accessToken = null;
  let gisReady = false;
  let busy = false;
  let unlocked = false;
  let wall = null;

  function lang(){
    try {
      const l = typeof window.idiomaActual === 'string' ? window.idiomaActual : '';
      if (l && DICT[l]) return l;
    } catch(_e){}
    const raw = String(document.documentElement.lang || navigator.language || 'es').toLowerCase();
    const k = raw.split('-')[0];
    return DICT[k] ? k : 'es';
  }
  function t(){ return DICT[lang()] || DICT.es; }

  function buildWall(){
    wall = document.getElementById('accessWallOverlay');
    if (!wall){
      wall = document.createElement('div');
      wall.id = 'accessWallOverlay';
      wall.setAttribute('role','dialog');
      wall.setAttribute('aria-modal','true');
      document.body.prepend(wall);
    }
    wall.innerHTML = `
      <div class="youtube-access-card" role="document">
        <div class="youtube-access-icon" aria-hidden="true">▶</div>
        <h1 id="youtubeAccessTitle"></h1>
        <p class="youtube-access-lead" id="youtubeAccessLead"></p>
        <p class="youtube-access-detail" id="youtubeAccessDetail"></p>
        <div class="youtube-access-status" id="youtubeAccessStatus" role="status" aria-live="polite"></div>
        <button type="button" class="youtube-access-btn" id="youtubeAccessSubscribe"></button>
        <a class="youtube-access-youtube" id="youtubeAccessOpenYoutube" target="_blank" rel="noopener noreferrer"></a>
        <div class="youtube-access-brand">YouTube · Kelonio</div>
      </div>`;
    injectStyles();
    refreshTexts();
    return wall;
  }

  function injectStyles(){
    if(document.getElementById('kelonio-youtube-wall-style')) return;
    const style=document.createElement('style');
    style.id='kelonio-youtube-wall-style';
    style.textContent=`
      html.youtube-wall-locked, body.youtube-wall-locked{overflow:hidden!important}
      #accessWallOverlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(8,9,12,.96);backdrop-filter:blur(12px);color:#fff;opacity:1;visibility:visible;pointer-events:auto;transition:opacity .35s ease,visibility .35s ease}
      #accessWallOverlay.youtube-wall-hidden{opacity:0;visibility:hidden;pointer-events:none}
      .youtube-access-card{width:min(92vw,560px);padding:42px 34px 32px;text-align:center;border-radius:24px;background:linear-gradient(180deg,rgba(28,31,39,.98),rgba(18,20,26,.98));border:1px solid rgba(255,255,255,.12);box-shadow:0 25px 80px rgba(0,0,0,.45),0 0 0 1px rgba(229,9,20,.06)}
      .youtube-access-icon{width:62px;height:44px;margin:0 auto 22px;border-radius:12px;background:#e50914;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;box-shadow:0 10px 30px rgba(229,9,20,.3)}
      .youtube-access-card h1{margin:0 0 12px;font-size:clamp(1.65rem,4vw,2.2rem);font-weight:900;letter-spacing:-.4px;color:#fff}
      .youtube-access-lead{margin:0 auto 12px;max-width:470px;font-size:1.05rem;line-height:1.55;color:#f2f2f2}
      .youtube-access-detail{margin:0 auto 22px;max-width:470px;font-size:.92rem;line-height:1.5;color:#aeb3bd}
      .youtube-access-status{min-height:22px;margin:0 0 12px;color:#cfd3da;font-weight:700;font-size:.84rem}
      .youtube-access-btn{width:100%;border:0;border-radius:12px;padding:14px 20px;background:#e50914;color:#fff;font:900 1rem/1.2 'Segoe UI',system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(229,9,20,.25);transition:transform .18s ease,filter .18s ease,box-shadow .18s ease}
      .youtube-access-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);box-shadow:0 14px 32px rgba(229,9,20,.34)}
      .youtube-access-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
      .youtube-access-btn:disabled{opacity:.72;cursor:wait}
      .youtube-access-youtube{display:block;margin:13px 0 0;color:#aeb3bd;text-decoration:none;font-size:.8rem;font-weight:700}
      .youtube-access-youtube:hover{text-decoration:underline;color:#fff}
      .youtube-access-brand{margin-top:24px;color:#686e79;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      @media(max-width:600px){#accessWallOverlay{padding:16px}.youtube-access-card{padding:34px 22px 25px;border-radius:20px}.youtube-access-lead{font-size:.98rem}.youtube-access-detail{font-size:.86rem}}
    `;
    document.head.appendChild(style);
  }

  function refreshTexts(){
    if(!wall) return;
    const d=t();
    const q=(id)=>wall.querySelector('#'+id);
    if(q('youtubeAccessTitle')) q('youtubeAccessTitle').textContent=d.title;
    if(q('youtubeAccessLead')) q('youtubeAccessLead').textContent=d.lead;
    if(q('youtubeAccessDetail')) q('youtubeAccessDetail').textContent=d.detail;
    if(q('youtubeAccessOpenYoutube')){ q('youtubeAccessOpenYoutube').textContent=d.openYoutube; q('youtubeAccessOpenYoutube').href=CHANNEL_URL; }
    const b=q('youtubeAccessSubscribe');
    if(b){
      b.textContent=busy?d.subscribing:(unlocked?d.subscribed:d.subscribe);
      b.disabled=busy || unlocked;
      b.setAttribute('aria-label',d.subscribeAria);
    }
  }

  function setStatus(key, custom){
    const el=wall && wall.querySelector('#youtubeAccessStatus');
    if(el) el.textContent=custom || t()[key] || '';
  }

  function showMemberCta(){
    const videos=Array.from(document.querySelectorAll('.guide-content .video-container'));
    if(!videos.length || document.getElementById('youtube-cta-box')) return;
    const last=videos[videos.length-1];
    const box=document.createElement('section');
    box.id='youtube-cta-box';
    box.className='youtube-cta-box';
    box.innerHTML=`<div class="youtube-cta-status"></div><div class="youtube-cta-actions"><a class="youtube-cta-member" target="_blank" rel="noopener noreferrer sponsored"></a></div>`;
    const style=document.createElement('style');
    style.textContent=`
      .youtube-cta-box{width:100%;margin:4px 0 30px;padding:17px 0 5px;border-top:1px solid var(--glass-border);text-align:center}
      .youtube-cta-status{min-height:1.2em;margin-bottom:10px}
      .youtube-cta-member{display:inline-flex;align-items:center;justify-content:center;padding:11px 18px;border-radius:10px;background:var(--red);color:#fff!important;text-decoration:none!important;font:900 .86rem/1.15 'Segoe UI',system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.18)}
      .youtube-cta-member:hover{filter:brightness(1.08);transform:translateY(-2px)}
    `;
    box.appendChild(style);
    last.insertAdjacentElement('afterend',box);
    const link=box.querySelector('.youtube-cta-member');
    link.href=JOIN_URL;
    link.textContent=t().member;
    link.setAttribute('aria-label',t().memberAria);
  }

  function hideWall(){
    unlocked=true;
    if(!wall) return;
    refreshTexts();
    setStatus('success');
    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');
    wall.classList.add('youtube-wall-hidden');
    window.setTimeout(()=>{ if(wall) wall.remove(); },380);
    showMemberCta();
    document.dispatchEvent(new CustomEvent('kelonio:youtubeAccessGranted'));
  }

  function showWall(){
    if(!wall) buildWall();
    wall.classList.remove('youtube-wall-hidden');
    document.documentElement.classList.add('youtube-wall-locked');
    document.body.classList.add('youtube-wall-locked');
    refreshTexts();
  }

  function loadGIS(){
    if(!CONFIG_OK || !CHANNEL_ID) return Promise.reject(new Error('not_configured'));
    if(window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-kelonio-gis]');
      if(existing){
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true; s.defer=true; s.dataset.kelonioGis='1';
      s.onload=resolve; s.onerror=()=>reject(new Error('gis_load_failed'));
      document.head.appendChild(s);
    });
  }

  function initGIS(){
    if(gisReady) return;
    if(!(window.google && google.accounts && google.accounts.oauth2)) return;
    tokenClient=google.accounts.oauth2.initTokenClient({
      client_id:CLIENT_ID,
      scope:YT_SCOPE,
      include_granted_scopes:true,
      callback:()=>{},
      error_callback:()=>{}
    });
    gisReady=true;
  }

  function tokenRequest(promptValue){
    return new Promise((resolve,reject)=>{
      if(!gisReady) return reject(new Error('gis_not_ready'));
      tokenClient.callback=(resp)=>{
        if(resp && resp.access_token){
          try{
            if(google.accounts.oauth2.hasGrantedAllScopes && !google.accounts.oauth2.hasGrantedAllScopes(resp,YT_SCOPE)){
              return reject(new Error('scope_not_granted'));
            }
          }catch(_e){}
          accessToken=resp.access_token;
          resolve(resp);
        }else reject(new Error((resp&&resp.error)||'no_token'));
      };
      tokenClient.error_callback=(err)=>reject(new Error(err && (err.type||err.error)||'oauth_error'));
      tokenClient.requestAccessToken({prompt:promptValue});
    });
  }

  async function checkSubscription(){
    if(!accessToken) return false;
    const params=new URLSearchParams({part:'id',mine:'true',forChannelId:CHANNEL_ID,maxResults:'1'});
    const res=await fetch(API+'/subscriptions?'+params.toString(),{headers:{Authorization:'Bearer '+accessToken}});
    if(res.status===401){accessToken=null;throw new Error('unauthorized');}
    if(!res.ok) throw new Error('check_failed_'+res.status);
    const data=await res.json();
    return Array.isArray(data.items) && data.items.length>0;
  }

  async function ensureSubscription(){
    if(busy || unlocked) return;
    busy=true;
    refreshTexts();
    setStatus('subscribing');
    try{
      if(!accessToken) await tokenRequest('');
      let subscribed=false;
      try { subscribed=await checkSubscription(); }
      catch(e){
        if(e.message==='unauthorized'){ await tokenRequest(''); subscribed=await checkSubscription(); }
        else throw e;
      }
      if(!subscribed){
        const res=await fetch(API+'/subscriptions?part=snippet',{method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify({snippet:{resourceId:{kind:'youtube#channel',channelId:CHANNEL_ID}}})});
        if(res.status===401){
          accessToken=null;
          await tokenRequest('');
          const retry=await fetch(API+'/subscriptions?part=snippet',{method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify({snippet:{resourceId:{kind:'youtube#channel',channelId:CHANNEL_ID}}})});
          if(!retry.ok) throw new Error('insert_failed_'+retry.status);
        }else if(!res.ok){
          if(res.status===400){
            try{const d=await res.json();if(d?.error?.errors?.some(x=>x.reason==='subscriptionDuplicate')) subscribed=true;}catch(_e){}
          }
          if(!subscribed && res.status!==200) throw new Error('insert_failed_'+res.status);
        }
      }
      // Re-check with the API before unlocking the guide.
      let verified=false;
      for(let i=0;i<3 && !verified;i++){
        try{ verified=await checkSubscription(); }catch(e){ if(e.message==='unauthorized'){ accessToken=null; await tokenRequest(''); continue; } throw e; }
        if(!verified && i<2) await new Promise(r=>setTimeout(r,900));
      }
      if(!verified) throw new Error('verification_failed');
      hideWall();
    }catch(e){
      busy=false;
      refreshTexts();
      const msg=e.message==='not_configured'?t().needConfig:(e.message==='oauth_error'||e.message==='scope_not_granted'?t().auth:t().error);
      setStatus(null,msg);
      return;
    }
    busy=false;
    refreshTexts();
  }

  async function bootstrap(){
    const videos=document.querySelectorAll('.guide-content .video-container');
    if(!videos.length) return;

    buildWall();
    showWall();

    const btn=wall.querySelector('#youtubeAccessSubscribe');
    btn.onclick=()=>ensureSubscription();

    if(!CONFIG_OK || !CHANNEL_ID){
      setStatus('needConfig');
      return;
    }

    try{
      setStatus('checking');
      await loadGIS();
      initGIS();
      // Comprobación silenciosa: si ya existe una sesión Google y el permiso
      // de YouTube ya fue concedido, no se muestra ningún cuadro de consentimiento.
      try{
        await tokenRequest('none');
        if(await checkSubscription()) hideWall();
        else { refreshTexts(); setStatus('auth'); }
      }catch(_e){
        accessToken=null;
        refreshTexts();
        setStatus('auth');
      }
    }catch(_e){
      setStatus('auth');
    }
  }

  document.addEventListener('kelonio:languageChanged',()=>{ refreshTexts(); const m=document.querySelector('#youtube-cta-box .youtube-cta-member'); if(m){m.textContent=t().member; m.setAttribute('aria-label',t().memberAria);} });
  document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
})();
