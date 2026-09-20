document.addEventListener("DOMContentLoaded", () => {
  'use strict';
  const amountSelect = document.getElementById('pp-amount');
  const freeOption = document.getElementById('pp-free');
  const membershipOption = document.getElementById('pp-membership');
  const contributionOption = document.getElementById('pp-other-amount');
  const membershipArea = document.getElementById('pp-membership-area');
  const membershipMsg = document.getElementById('pp-membership-msg');
  const membershipJoin = document.getElementById('pp-membership-join');
  const membershipDownload = document.getElementById('pp-membership-download');
  const downloadBtn = document.getElementById('pp-download-btn');
  const customAmountInput = document.getElementById('pp-custom-amount');
  const paypalContainer = document.getElementById('paypal-button-container');
  const paypalLoading = document.getElementById('pp-paypal-loading');
  const successMsg = document.getElementById('pp-success-msg');
  const titleEl = document.getElementById('pp-title');
  const subtitleEl = document.getElementById('pp-subtitle');
  if (!amountSelect || !freeOption || !membershipOption || !contributionOption || !membershipArea || !membershipMsg || !membershipJoin || !membershipDownload || !downloadBtn || !customAmountInput || !paypalContainer || !paypalLoading || !successMsg || !titleEl || !subtitleEl) return;

  const T = {"es":{"title":"¡Ahora puedes aportar al proyecto! [ARCHIVOS]","subtitle":"(La opción gratuita siempre estará disponible)","free":"Gratis","membership":"Membresía","contribution":"Contribución","placeholder":"Ej: 2.50","download":"Descargar Archivos","success":"Gracias por apoyar el proyecto. Tu pago se ha recibido correctamente.","verifying":"Procesando acceso de membresía…","membershipAria":"Abrir la página de membresía y continuar","paypalLoading":"Cargando PayPal…","join":"Hacerse miembro","joinAria":"Hacerse miembro del canal de YouTube","downloadAria":"Descargar Archivos"},"en":{"title":"You can now support the project! [FILES]","subtitle":"(The free option will always be available)","free":"Free","membership":"Membership","contribution":"Contribution","placeholder":"Ex: 2.50","download":"Download Files","success":"Thank you for supporting the project. Your payment was successful.","verifying":"Processing membership access…","membershipAria":"Open the membership page and continue","paypalLoading":"Loading PayPal…","join":"Become a member","joinAria":"Become a member of the YouTube channel","downloadAria":"Download Files"},"fr":{"title":"Vous pouvez désormais soutenir le projet ! [FICHIERS]","subtitle":"(L'option gratuite sera toujours disponible)","free":"Gratuit","membership":"Devenir membre","contribution":"Contribution","placeholder":"Ex : 2.50","download":"Télécharger les fichiers","success":"Merci de soutenir le projet. Votre paiement a bien été reçu.","verifying":"Traitement de l’accès membre…","membershipAria":"Ouvrir la page d’adhésion et continuer","paypalLoading":"Chargement de PayPal…","join":"Devenir membre","joinAria":"Devenir membre de la chaîne YouTube","downloadAria":"Télécharger les fichiers"},"de":{"title":"Du kannst das Projekt jetzt unterstützen! [DATEIEN]","subtitle":"(Die kostenlose Option wird immer verfügbar sein)","free":"Kostenlos","membership":"Mitgliedschaft","contribution":"Beitrag","placeholder":"Bsp: 2.50","download":"Dateien herunterladen","success":"Danke, dass du das Projekt unterstützt. Deine Zahlung war erfolgreich.","verifying":"Mitgliedschaftszugriff wird verarbeitet…","membershipAria":"Mitgliedschaftsseite öffnen und fortfahren","paypalLoading":"PayPal wird geladen…","join":"Mitglied werden","joinAria":"Mitglied des YouTube-Kanals werden","downloadAria":"Dateien herunterladen"},"it":{"title":"Ora puoi sostenere il progetto! [FILE]","subtitle":"(L'opzione gratuita sarà sempre disponibile)","free":"Gratis","membership":"Diventa membro","contribution":"Contribuzione","placeholder":"Es: 2.50","download":"Scarica i file","success":"Grazie per aver sostenuto il progetto. Il tuo pagamento è stato ricevuto correttamente.","verifying":"Accesso membri in elaborazione…","membershipAria":"Apri la pagina di iscrizione e continua","paypalLoading":"Caricamento di PayPal…","join":"Diventa membro","joinAria":"Diventare membro del canale YouTube","downloadAria":"Scarica i file"},"pt":{"title":"Agora você pode apoiar o projeto! [ARQUIVOS]","subtitle":"(A opção gratuita estará sempre disponível)","free":"Grátis","membership":"Membresia","contribution":"Contribuição","placeholder":"Ex: 2.50","download":"Baixar Arquivos","success":"Obrigado por apoiar o projeto. Seu pagamento foi recebido com sucesso.","verifying":"A processar o acesso de membro…","membershipAria":"Abrir a página de adesão e continuar","paypalLoading":"A carregar o PayPal…","join":"Tornar-se membro","joinAria":"Tornar-se membro do canal do YouTube","downloadAria":"Baixar Arquivos"},"ja":{"title":"プロジェクトを支援できるようになりました！ [ファイル]","subtitle":"（無料オプションは常に利用可能です）","free":"無料","membership":"メンバーシップ","contribution":"貢献","placeholder":"例: 2.50","download":"ファイルをダウンロード","success":"プロジェクトをご支援いただきありがとうございます。お支払いが正常に完了しました。","verifying":"メンバーシップのアクセスを処理中…","membershipAria":"メンバーシップページを開いて続行","paypalLoading":"PayPalを読み込んでいます…","join":"メンバーになる","joinAria":"YouTube チャンネルのメンバーになる","downloadAria":"ファイルをダウンロード"},"ko":{"title":"이제 프로젝트를 후원할 수 있습니다! [파일]","subtitle":"(무료 옵션은 항상 제공됩니다)","free":"무료","membership":"멤버십","contribution":"기부금","placeholder":"예: 2.50","download":"파일 다운로드","success":"프로젝트를 지원해 주셔서 감사합니다. 결제가 성공적으로 완료되었습니다.","verifying":"멤버십 액세스를 처리하는 중…","membershipAria":"멤버십 페이지를 열고 계속","paypalLoading":"PayPal 로드 중…","join":"멤버 되기","joinAria":"YouTube 채널의 멤버 되기","downloadAria":"파일 다운로드"}};
  const LOCALES = {"es":"es_ES","en":"en_US","fr":"fr_FR","it":"it_IT","de":"de_DE","pt":"pt_PT","ja":"ja_JP","ko":"ko_KR"};
  const JOIN_URL = 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw/join';
  const PAYPAL_CLIENT_ID = 'BAAVNxy3Tb2YimilSFmYtRneRHtNa9WqZwfcVXSwpX88LHG9OCSn7hwPMTassgMIf5oyVHms5YdsmQpUZk';
  const MEMBERSHIP_CACHE_KEY = 'kelonio.membership.access.v22';
  const MEMBERSHIP_PENDING_KEY = 'kelonio.membership.pending.v19';
  const MEMBERSHIP_CACHE_MS = 15 * 24 * 60 * 60 * 1000;
  const MEMBERSHIP_WAIT_MS = 100 * 1000;
  let timer = null;
  let until = 0;
  let paypalPromise = null;
  let paypalRendered = false;

  function getLang() {
    try {
      const current = String(window.idiomaActual || '').toLowerCase().split('-')[0];
      const pref = String(localStorage.getItem('preferredLanguage') || '').toLowerCase().split('-')[0];
      const raw = current || pref || String(document.documentElement.lang || navigator.language || 'es').toLowerCase().split('-')[0];
      return T[raw] ? raw : 'es';
    } catch (_) { return 'es'; }
  }
  function text() { return T[getLang()] || T.es; }
  function applyLanguage() {
    const t = text();
    titleEl.textContent = t.title;
    subtitleEl.textContent = t.subtitle;
    membershipOption.textContent = t.membership;
    freeOption.textContent = t.free;
    contributionOption.textContent = t.contribution;
    customAmountInput.placeholder = t.placeholder;
    downloadBtn.textContent = t.download;
    downloadBtn.setAttribute('aria-label', t.downloadAria || t.download);
    membershipJoin.textContent = t.join;
    membershipJoin.setAttribute('aria-label', t.joinAria);
    membershipDownload.textContent = t.download;
    membershipDownload.setAttribute('aria-label', t.downloadAria || t.download);
    successMsg.textContent = t.success;
    membershipMsg.textContent = t.verifying;
    paypalLoading.textContent = t.paypalLoading;
  }
  function readMembershipCache() {
    try {
      const raw = localStorage.getItem(MEMBERSHIP_CACHE_KEY);
      if (!raw) return false;
      const v = JSON.parse(raw);
      if (!v || Number(v.expiresAt) <= Date.now()) { localStorage.removeItem(MEMBERSHIP_CACHE_KEY); return false; }
      return v.verified === true;
    } catch (_) { return false; }
  }
  function writeMembershipCache() {
    try { const now=Date.now(); localStorage.setItem(MEMBERSHIP_CACHE_KEY, JSON.stringify({verified:true,verifiedAt:now,expiresAt:now+MEMBERSHIP_CACHE_MS})); localStorage.removeItem(MEMBERSHIP_PENDING_KEY); } catch (_) {}
  }
  function readPendingUntil() {
    try { const v=Number(localStorage.getItem(MEMBERSHIP_PENDING_KEY)||0); return v>Date.now()?v:0; } catch (_) { return 0; }
  }
  function writePendingUntil(v) { try { localStorage.setItem(MEMBERSHIP_PENDING_KEY,String(v)); } catch (_) {} }
  function clearTimer() { if (timer) { clearInterval(timer); timer=null; } }
  function styleMembershipDownload(active) {
    membershipDownload.classList.toggle('pp-membership-ready', active);
    membershipDownload.setAttribute('aria-disabled', active ? 'false' : 'true');
    membershipDownload.style.pointerEvents = active ? 'auto' : 'none';
    membershipDownload.style.cursor = active ? 'pointer' : 'default';
    membershipDownload.style.background = active ? 'var(--red)' : 'transparent';
    membershipDownload.style.borderColor = active ? 'var(--red)' : 'rgba(127,127,127,.45)';
    membershipDownload.style.color = active ? '#fff' : '#8a8a8a';
    membershipDownload.style.boxShadow = active ? '0 6px 18px rgba(0,0,0,.16)' : 'none';
    membershipDownload.style.transform = 'none';
    membershipDownload.tabIndex = active ? 0 : -1;
  }
  function unlockMembership() {
    clearTimer(); until=0; membershipArea.hidden=false; membershipMsg.style.display='none'; styleMembershipDownload(true); downloadBtn.style.display='none'; writeMembershipCache();
  }
  function showMembershipIdle() {
    membershipArea.hidden=false;
    membershipMsg.textContent='';
    membershipMsg.style.display='none';
    const membershipActions=document.getElementById('pp-membership-actions');
    if(membershipActions) membershipActions.style.display='flex';
    membershipJoin.hidden=false;
    membershipDownload.hidden=false;
    styleMembershipDownload(false);
    downloadBtn.style.display='none';
  }
  function showMembershipChecking() {
    membershipArea.hidden=false;
    membershipMsg.textContent=text().verifying;
    membershipMsg.style.display='block';
    const membershipActions=document.getElementById('pp-membership-actions');
    if(membershipActions) membershipActions.style.display='flex';
    membershipJoin.hidden=false; membershipDownload.hidden=false;
    styleMembershipDownload(false);
    downloadBtn.style.display='none';
  }
  function tickMembership() {
    if (Date.now()>=until) unlockMembership(); else showMembershipChecking();
  }
  function startMembershipGate(openPage) {
    clearTimer();
    if (readMembershipCache()) { unlockMembership(); return; }
    const pending=readPendingUntil();
    until=pending || (Date.now()+MEMBERSHIP_WAIT_MS);
    writePendingUntil(until);
    if (openPage) { try { window.open(JOIN_URL,'_blank','noopener,noreferrer'); } catch (_) {} }
    tickMembership();
    timer=setInterval(tickMembership,500);
  }
  function hideMembershipGate() { clearTimer(); until=0; membershipArea.hidden=true; membershipMsg.style.display='none'; styleMembershipDownload(false); }
  function resetPaymentView() { successMsg.style.display='none'; paypalLoading.style.display='none'; customAmountInput.style.display='none'; paypalContainer.style.display='none'; paypalContainer.innerHTML=''; paypalRendered=false; }
  function loadPayPalSDK() {
    if (window.paypal) return Promise.resolve();
    if (paypalPromise) return paypalPromise;
    paypalPromise=new Promise((resolve,reject)=>{
      const existing=document.getElementById('paypal-sdk-script-v19');
      if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',()=>reject(new Error('paypal_load_failed')),{once:true}); return; }
      const script=document.createElement('script'); script.id='paypal-sdk-script-v19'; script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(PAYPAL_CLIENT_ID)+'&currency=EUR&locale='+(LOCALES[getLang()]||'en_US');
      script.onload=()=>resolve(); script.onerror=()=>reject(new Error('paypal_load_failed')); document.head.appendChild(script);
    });
    return paypalPromise;
  }
  function renderPayPal() {
    if (!window.paypal || paypalRendered) return;
    paypalRendered=true; paypalContainer.innerHTML='';
    window.paypal.Buttons({
      createOrder:function(data,actions){ let finalAmount=customAmountInput.value; if(!finalAmount||parseFloat(finalAmount)<0.5) finalAmount='0.50'; return actions.order.create({purchase_units:[{amount:{value:parseFloat(finalAmount).toFixed(2)}}]}); },
      onApprove:function(data,actions){ return actions.order.capture().then(function(){ amountSelect.style.display='none'; customAmountInput.style.display='none'; paypalContainer.style.display='none'; paypalLoading.style.display='none'; successMsg.style.display='block'; downloadBtn.style.display='block'; }); }
    }).render('#paypal-button-container');
  }
  async function showContribution(){ hideMembershipGate(); successMsg.style.display='none'; downloadBtn.style.display='none'; customAmountInput.style.display='block'; paypalContainer.style.display='block'; paypalLoading.style.display='block'; try{ await loadPayPalSDK(); paypalLoading.style.display='none'; renderPayPal(); }catch(_){ paypalLoading.textContent='PayPal'; } }
  function showFree(){ hideMembershipGate(); resetPaymentView(); downloadBtn.style.display='block'; }
  function updateView(fromUser){
    const value=amountSelect.value;
    if(value==='membership'){
      resetPaymentView();
      if(readMembershipCache()) unlockMembership();
      else {
        const pending=readPendingUntil();
        if(pending) startMembershipGate(false);
        else showMembershipIdle();
      }
    } else if(value==='0'){ clearTimer(); until=0; showFree(); } else { clearTimer(); until=0; showContribution(); }
  }
  amountSelect.addEventListener('change',()=>updateView(true));
  membershipJoin.addEventListener('click',()=>startMembershipGate(false));
  membershipDownload.addEventListener('click',(ev)=>{ if(membershipDownload.getAttribute('aria-disabled')==='true' || !readMembershipCache()){ ev.preventDefault(); startMembershipGate(false); } });
  const languageSelector=document.getElementById('languageSelector');
  if(languageSelector) languageSelector.addEventListener('change',()=>setTimeout(()=>{ applyLanguage(); },0));
  document.addEventListener('kelonio:languageChanged',()=>setTimeout(applyLanguage,0));

  // Membresía es la primera opción y la opción por defecto.
  applyLanguage();
  amountSelect.value='membership';
  if(readMembershipCache()) unlockMembership();
  else {
    const pending=readPendingUntil();
    if(pending) startMembershipGate(false);
    else showMembershipIdle();
  }
});
