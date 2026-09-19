/* Kelonio — Muro de acceso por suscripción a YouTube
 *
 * Acceso condicionado a una suscripción real al canal configurado.
 * Usa Google Identity Services + YouTube Data API, sin bots ni
 * automatización de la interfaz de YouTube.
 */
(function () {
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
  const GIS_URL = 'https://accounts.google.com/gsi/client';
  const CONFIG_OK = /^\d[\w-]*\.apps\.googleusercontent\.com$/.test(CLIENT_ID) && !CLIENT_ID.startsWith('PON_AQUI');
  const CACHE_KEY = 'kelonio.youtube.access.v11';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  const DICT = {
    es: {
      title: 'Acceso a la guía',
      lead: 'Para continuar, suscríbete al canal de Kelonio en YouTube.',
      detail: 'La suscripción se comprueba con tu cuenta de Google y, una vez verificada, tendrás acceso a la guía.',
      subscribe: 'Suscribirme con Google',
      checking: 'Comprobando tu suscripción…',
      subscribing: 'Suscribiendo…',
      subscribed: 'Suscripción verificada ✓',
      success: 'Suscripción verificada. Abriendo la guía…',
      auth: 'Necesitamos autorización de YouTube para comprobar tu suscripción.',
      needConfig: 'El acceso por suscripción necesita configurar el Client ID de Google.',
      error: 'No se ha podido verificar la suscripción. Inténtalo de nuevo.',

      subscribeAria: 'Suscribirme al canal de YouTube con mi cuenta de Google',
      owner: 'Propietario de Kelonio detectado ✓',
      ownerDetail: 'Esta cuenta administra el canal de Kelonio. La guía se desbloquea automáticamente.'
    },
    en: {
      title: 'Guide access',
      lead: 'To continue, subscribe to the Kelonio channel on YouTube.',
      detail: 'Your subscription is checked with your Google account. Once verified, you will have access to the guide.',
      subscribe: 'Subscribe with Google',
      checking: 'Checking your subscription…',
      subscribing: 'Subscribing…',
      subscribed: 'Subscription verified ✓',
      success: 'Subscription verified. Opening the guide…',
      auth: 'YouTube authorization is needed to check your subscription.',
      needConfig: 'Subscription access requires the Google Client ID to be configured.',
      error: 'The subscription could not be verified. Please try again.',
   
      subscribeAria: 'Subscribe to the YouTube channel with my Google account',
      owner: 'Kelonio owner detected ✓',
      ownerDetail: 'This account manages the Kelonio channel. The guide is unlocked automatically.'
    },
    fr: {
      title: 'Accès au guide',
      lead: 'Pour continuer, abonnez-vous à la chaîne Kelonio sur YouTube.',
      detail: 'Votre abonnement est vérifié avec votre compte Google. Une fois vérifié, vous aurez accès au guide.',
      subscribe: "M'abonner avec Google",
      checking: 'Vérification de votre abonnement…',
      subscribing: 'Abonnement en cours…',
      subscribed: 'Abonnement vérifié ✓',
      success: 'Abonnement vérifié. Ouverture du guide…',
      auth: "Une autorisation YouTube est nécessaire pour vérifier votre abonnement.",
      needConfig: "L'accès par abonnement nécessite de configurer le Client ID Google.",
      error: "Impossible de vérifier l'abonnement. Réessayez.",

      subscribeAria: 'S’abonner à la chaîne YouTube avec mon compte Google',
      owner: 'Propriétaire de Kelonio détecté ✓',
      ownerDetail: 'Ce compte gère la chaîne Kelonio. Le guide est déverrouillé automatiquement.'
    },
    de: {
      title: 'Zugriff auf die Anleitung',
      lead: 'Um fortzufahren, abonniere den Kelonio-Kanal auf YouTube.',
      detail: 'Dein Abonnement wird mit deinem Google-Konto geprüft. Nach der Bestätigung erhältst du Zugriff auf die Anleitung.',
      subscribe: 'Mit Google abonnieren',
      checking: 'Abonnement wird geprüft…',
      subscribing: 'Abonnement wird durchgeführt…',
      subscribed: 'Abonnement bestätigt ✓',
      success: 'Abonnement bestätigt. Anleitung wird geöffnet…',
      auth: 'Zur Prüfung deines Abonnements ist eine YouTube-Autorisierung erforderlich.',
      needConfig: 'Für den Zugriff per Abonnement muss die Google Client-ID konfiguriert werden.',
      error: 'Das Abonnement konnte nicht überprüft werden. Bitte erneut versuchen.',

      subscribeAria: 'Den YouTube-Kanal mit meinem Google-Konto abonnieren',
      owner: 'Kelonio-Inhaber erkannt ✓',
      ownerDetail: 'Dieses Konto verwaltet den Kelonio-Kanal. Die Anleitung wird automatisch freigeschaltet.'
    },
    it: {
      title: 'Accesso alla guida',
      lead: 'Per continuare, iscriviti al canale Kelonio su YouTube.',
      detail: 'La tua iscrizione viene verificata con il tuo account Google. Dopo la verifica avrai accesso alla guida.',
      subscribe: 'Iscriviti con Google',
      checking: 'Controllo dell’iscrizione…',
      subscribing: 'Iscrizione in corso…',
      subscribed: 'Iscrizione verificata ✓',
      success: 'Iscrizione verificata. Apertura della guida…',
      auth: 'È necessaria l’autorizzazione di YouTube per verificare la tua iscrizione.',
      needConfig: 'Per l’accesso tramite iscrizione è necessario configurare il Client ID Google.',
      error: 'Non è stato possibile verificare l’iscrizione. Riprova.',

      subscribeAria: 'Iscriviti al canale YouTube con il mio account Google',
      owner: 'Proprietario Kelonio rilevato ✓',
      ownerDetail: 'Questo account gestisce il canale Kelonio. La guida viene sbloccata automaticamente.'
    },
    pt: {
      title: 'Acesso ao guia',
      lead: 'Para continuar, subscreva o canal Kelonio no YouTube.',
      detail: 'A sua subscrição é verificada com a sua conta Google. Depois de verificada, terá acesso ao guia.',
      subscribe: 'Subscrever com Google',
      checking: 'A verificar a subscrição…',
      subscribing: 'A subscrever…',
      subscribed: 'Subscrição verificada ✓',
      success: 'Subscrição verificada. A abrir o guia…',
      auth: 'É necessária autorização do YouTube para verificar a sua subscrição.',
      needConfig: 'O acesso por subscrição requer a configuração do Client ID da Google.',
      error: 'Não foi possível verificar a subscrição. Tente novamente.',

      subscribeAria: 'Subscrever o canal do YouTube com a minha conta Google',
      owner: 'Proprietário da Kelonio detetado ✓',
      ownerDetail: 'Esta conta gere o canal Kelonio. O guia é desbloqueado automaticamente.'
    },
    ja: {
      title: 'ガイドへのアクセス',
      lead: '続行するには、YouTube の Kelonio チャンネルに登録してください。',
      detail: 'Google アカウントでチャンネル登録を確認します。確認が完了すると、このガイドにアクセスできます。',
      subscribe: 'Google でチャンネル登録',
      checking: '登録状況を確認中…',
      subscribing: 'チャンネル登録中…',
      subscribed: '登録を確認しました ✓',
      success: '登録を確認しました。ガイドを開きます…',
      auth: '登録状況を確認するには YouTube の認証が必要です。',
      needConfig: '登録によるアクセスには Google Client ID の設定が必要です。',
      error: '登録状況を確認できませんでした。もう一度お試しください。',

      subscribeAria: 'Google アカウントで YouTube チャンネルに登録',
      owner: 'Kelonio オーナーを確認しました ✓',
      ownerDetail: 'このアカウントは Kelonio チャンネルを管理しています。ガイドを自動的に開きます。'
    },
    ko: {
      title: '가이드 이용',
      lead: '계속하려면 YouTube에서 Kelonio 채널을 구독하세요.',
      detail: 'Google 계정으로 구독 여부를 확인합니다. 확인되면 가이드에 접근할 수 있습니다.',
      subscribe: 'Google로 구독하기',
      checking: '구독 확인 중…',
      subscribing: '구독하는 중…',
      subscribed: '구독 확인 완료 ✓',
      success: '구독이 확인되었습니다. 가이드를 엽니다…',
      auth: '구독 여부를 확인하려면 YouTube 인증이 필요합니다.',
      needConfig: '구독을 통한 접근을 사용하려면 Google Client ID 설정이 필요합니다.',
      error: '구독을 확인할 수 없습니다. 다시 시도해 주세요.',

      subscribeAria: 'Google 계정으로 YouTube 채널 구독',
      owner: 'Kelonio 소유자 확인 ✓',
      ownerDetail: '이 계정은 Kelonio 채널을 관리합니다. 가이드가 자동으로 잠금 해제됩니다.'
    }
  };

  let tokenClient = null;
  let accessToken = null;
  let gisReady = false;
  let busy = false;
  let unlocked = false;
  let ownerDetected = false;
  let wall = null;
  let gisLoadPromise = null;

  function readAccessCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      const verifiedAt = Number(data.verifiedAt || 0);
      const age = Date.now() - verifiedAt;
      if (!verifiedAt || age < 0 || age >= CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return {
        verified: data.verified === true,
        owner: data.owner === true,
        verifiedAt
      };
    } catch (_) {
      return null;
    }
  }

  function writeAccessCache(kind) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: 11,
        verified: true,
        owner: kind === 'owner',
        verifiedAt: Date.now()
      }));
    } catch (_) {}
  }

  function clearAccessCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
  }

  function lang() {
    try {
      const l = typeof window.idiomaActual === 'string' ? window.idiomaActual : '';
      if (l && DICT[l]) return l;
    } catch (_) {}
    const raw = String(document.documentElement.lang || navigator.language || 'es').toLowerCase();
    const k = raw.split('-')[0];
    return DICT[k] ? k : 'es';
  }

  function t() {
    return DICT[lang()] || DICT.es;
  }

  function buildWall() {
    removeLegacyMemberCta();
    wall = document.getElementById('accessWallOverlay');
    if (!wall) {
      wall = document.createElement('div');
      wall.id = 'accessWallOverlay';
      wall.setAttribute('role', 'dialog');
      wall.setAttribute('aria-modal', 'true');
      wall.setAttribute('aria-labelledby', 'youtubeAccessTitle');
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
    // Keep the button disabled until GIS has initialized and the silent
    // background check has finished. This prevents a click from racing with
    // the silent token request and overwriting its callback.
    const subscribeButton = wall.querySelector('#youtubeAccessSubscribe');
    if (subscribeButton) {
      subscribeButton.disabled = true;
      subscribeButton.setAttribute('aria-disabled', 'true');
    }
    return wall;
  }

  function injectStyles() {
    if (document.getElementById('kelonio-youtube-wall-style')) return;

    const style = document.createElement('style');
    style.id = 'kelonio-youtube-wall-style';
    style.textContent = `
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

  function refreshTexts() {
    if (!wall) return;
    const d = t();
    const q = (id) => wall.querySelector('#' + id);

    if (q('youtubeAccessTitle')) q('youtubeAccessTitle').textContent = d.title;
    if (q('youtubeAccessLead')) q('youtubeAccessLead').textContent = d.lead;
    if (q('youtubeAccessDetail')) q('youtubeAccessDetail').textContent = d.detail;

    const open = q('youtubeAccessOpenYoutube');
    if (open) {
      open.textContent = d.openYoutube;
      open.href = CHANNEL_URL;
      open.setAttribute('aria-label', d.openYoutube);
    }

    const button = q('youtubeAccessSubscribe');
    if (button) {
      button.textContent = busy ? d.subscribing : (ownerDetected ? d.owner : (unlocked ? d.subscribed : d.subscribe));
      button.disabled = busy || unlocked || ownerDetected;
      button.setAttribute('aria-label', d.subscribeAria);
    }
  }

  function setStatus(key, custom) {
    const el = wall && wall.querySelector('#youtubeAccessStatus');
    if (el) el.textContent = custom || t()[key] || '';
  }


  function removeLegacyMemberCta() {
    document.querySelectorAll('#youtube-cta-box, .youtube-cta-box').forEach(el => el.remove());
    document.querySelectorAll('.youtube-cta-member').forEach(el => {
      const box = el.closest('#youtube-cta-box, .youtube-cta-box');
      if (box) box.remove();
    });
  }

  function hideWall(cacheKind) {
    unlocked = true;
    writeAccessCache(cacheKind === 'owner' ? 'owner' : 'subscription');
    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');

    if (wall) {
      refreshTexts();
      setStatus('success');
      wall.classList.add('youtube-wall-hidden');
      window.setTimeout(() => {
        if (wall) wall.remove();
      }, 380);
    }

    document.dispatchEvent(new CustomEvent('kelonio:youtubeAccessGranted'));
  }

  function showWall() {
    if (!wall) buildWall();
    wall.classList.remove('youtube-wall-hidden');
    document.documentElement.classList.add('youtube-wall-locked');
    document.body.classList.add('youtube-wall-locked');
    refreshTexts();
  }

  function loadGIS() {
    if (!CONFIG_OK || !CHANNEL_ID) {
      return Promise.reject(new Error('not_configured'));
    }

    if (window.google && google.accounts && google.accounts.oauth2) {
      return Promise.resolve();
    }

    if (gisLoadPromise) return gisLoadPromise;

    gisLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-kelonio-gis]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('gis_load_failed')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = GIS_URL;
      script.async = true;
      script.defer = true;
      script.dataset.kelonioGis = '1';
      script.onload = resolve;
      script.onerror = () => reject(new Error('gis_load_failed'));
      document.head.appendChild(script);
    }).finally(() => {
      gisLoadPromise = null;
    });

    return gisLoadPromise;
  }

  function initGIS() {
    if (gisReady) return true;
    if (!(window.google && google.accounts && google.accounts.oauth2)) return false;

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: YT_SCOPE,
      include_granted_scopes: true,
      callback: () => {},
      error_callback: () => {}
    });

    gisReady = true;
    return true;
  }

  function isRecoverableOAuthError(message) {
    return [
      'interaction_required',
      'consent_required',
      'login_required',
      'access_denied',
      'oauth_error'
    ].includes(String(message || ''));
  }

  function tokenRequest(promptValue) {
    return new Promise((resolve, reject) => {
      if (!gisReady || !tokenClient) {
        reject(new Error('gis_not_ready'));
        return;
      }

      tokenClient.callback = (resp) => {
        if (!resp || !resp.access_token) {
          reject(new Error((resp && (resp.error || resp.error_description)) || 'no_token'));
          return;
        }

        const grantedScope = String(resp.scope || '').split(/\s+/).filter(Boolean);
        let scopeOk = grantedScope.includes(YT_SCOPE);

        try {
          if (typeof google.accounts.oauth2.hasGrantedAllScopes === 'function') {
            scopeOk = google.accounts.oauth2.hasGrantedAllScopes(resp, YT_SCOPE);
          }
        } catch (_) {}

        if (!scopeOk) {
          reject(new Error('scope_not_granted'));
          return;
        }

        accessToken = resp.access_token;
        resolve(resp);
      };

      tokenClient.error_callback = (err) => {
        reject(new Error((err && (err.type || err.error || err.message)) || 'oauth_error'));
      };

      try {
        const request = promptValue ? { prompt: promptValue } : {};
        tokenClient.requestAccessToken(request);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('oauth_error'));
      }
    });
  }

  async function apiFetch(url, options) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);

    try {
      const headers = Object.assign({}, (options && options.headers) || {}, {
        Authorization: 'Bearer ' + accessToken
      });
      return await fetch(url, Object.assign({}, options || {}, { headers, signal: controller.signal }));
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function checkOwnerChannel() {
    if (!accessToken || !CHANNEL_ID) return false;

    const params = new URLSearchParams({
      part: 'id',
      mine: 'true',
      maxResults: '50'
    });

    const response = await apiFetch(API + '/channels?' + params.toString());

    if (response.status === 401) {
      accessToken = null;
      throw new Error('unauthorized');
    }

    if (!response.ok) {
      throw new Error('owner_check_failed_' + response.status);
    }

    const data = await response.json();
    return Array.isArray(data.items) && data.items.some((item) => String(item && item.id || '') === CHANNEL_ID);
  }

  async function checkSubscription() {
    if (!accessToken) return false;

    const params = new URLSearchParams({
      part: 'id',
      mine: 'true',
      forChannelId: CHANNEL_ID,
      maxResults: '1'
    });

    const response = await apiFetch(API + '/subscriptions?' + params.toString());

    if (response.status === 401) {
      accessToken = null;
      throw new Error('unauthorized');
    }

    if (!response.ok) {
      throw new Error('check_failed_' + response.status);
    }

    const data = await response.json();
    return Array.isArray(data.items) && data.items.length > 0;
  }

  async function subscribe() {
    const response = await apiFetch(API + '/subscriptions?part=snippet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: CHANNEL_ID
          }
        }
      })
    });

    if (response.status === 401) {
      accessToken = null;
      throw new Error('unauthorized');
    }

    if (response.ok) return true;

    // In case the subscription was created between the initial check and insert.
    if (response.status === 400) {
      try {
        const data = await response.json();
        const duplicated = data && data.error && Array.isArray(data.error.errors) &&
          data.error.errors.some((item) => item && item.reason === 'subscriptionDuplicate');
        if (duplicated) return true;
      } catch (_) {}
    }

    throw new Error('insert_failed_' + response.status);
  }

  async function ensureSubscription() {
    if (busy || unlocked) return;

    // GIS is preloaded and the button remains disabled until the initial
    // silent check completes. requestAccessToken() therefore runs directly
    // from this click, preserving the user gesture required for Google's
    // account/consent UI.
    if (!gisReady) {
      setStatus('auth');
      return;
    }

    busy = true;
    refreshTexts();
    setStatus('subscribing');

    try {
      if (!accessToken) {
        // No prompt override: reuse a previous grant if it exists; otherwise
        // Google opens the account/consent flow. Crucially, this call is made
        // directly from the button click, with no awaited request before it.
        await tokenRequest('');
      }

      if (await checkOwnerChannel()) {
        ownerDetected = true;
        const d = t();
        refreshTexts();
        setStatus(null, d.ownerDetail || d.owner);
        hideWall('owner');
        return;
      }

      let subscribed = await checkSubscription();
      if (!subscribed) {
        try {
          await subscribe();
        } catch (error) {
          if (error.message === 'unauthorized') {
            throw new Error('reauthorization_needed');
          } else {
            throw error;
          }
        }
      }

      // The insert call itself is the authoritative success response. Re-check
      // once when possible so the UI only unlocks after the API confirms it.
      let verified = false;
      for (let attempt = 0; attempt < 3 && !verified; attempt += 1) {
        try {
          verified = await checkSubscription();
        } catch (error) {
          if (error.message === 'unauthorized') {
            throw new Error('reauthorization_needed');
          }
          throw error;
        }

        if (!verified && attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 800));
        }
      }

      if (!verified) throw new Error('verification_failed');

      hideWall('subscription');
    } catch (error) {
      accessToken = null;
      clearAccessCache();
      const message = error && error.message ? error.message : '';
      const text = message === 'not_configured'
        ? t().needConfig
        : (message === 'reauthorization_needed' || message === 'scope_not_granted' || isRecoverableOAuthError(message)
          ? t().auth
          : t().error);
      setStatus(null, text);
    } finally {
      busy = false;
      if (wall) {
        refreshTexts();
        if (!unlocked && !ownerDetected && gisReady) {
          const subscribeButton = wall.querySelector('#youtubeAccessSubscribe');
          if (subscribeButton) {
            subscribeButton.disabled = false;
            subscribeButton.setAttribute('aria-disabled', 'false');
          }
        }
      }
    }
  }

  function unlockFromCache(cached) {
    ownerDetected = cached.owner === true;
    unlocked = true;

    // La plantilla de las guías incluye un muro estático para evitar que
    // el contenido aparezca antes de que cargue este script. En una
    // recarga con caché válida ese muro ya existe en el DOM, por lo que
    // debemos ocultarlo explícitamente antes de salir de bootstrap().
    wall = document.getElementById('accessWallOverlay');
    injectStyles();
    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');

    if (wall) {
      wall.classList.add('youtube-wall-hidden');
      window.setTimeout(() => {
        if (wall) wall.remove();
      }, 380);
    }

    document.dispatchEvent(new CustomEvent('kelonio:youtubeAccessGranted', {
      detail: { source: 'local-cache-24h', owner: cached.owner }
    }));
  }

  async function bootstrap() {
    const videos = document.querySelectorAll('.guide-content .video-container');
    if (!videos.length) {
      // Defense in depth: non-video guides must never inherit the YouTube wall
      // from an older template or a stale DOM state.
      document.documentElement.classList.remove('youtube-wall-locked');
      document.body.classList.remove('youtube-wall-locked');
      const legacyWall = document.getElementById('accessWallOverlay');
      if (legacyWall) legacyWall.remove();
      return;
    }

    const cached = readAccessCache();
    if (cached && cached.verified) {
      unlockFromCache(cached);
      return;
    }

    buildWall();
    showWall();

    const button = wall.querySelector('#youtubeAccessSubscribe');
    button.addEventListener('click', ensureSubscription);

    if (!CONFIG_OK || !CHANNEL_ID) {
      setStatus('needConfig');
      return;
    }

    try {
      setStatus('checking');
      await loadGIS();
      if (!initGIS()) throw new Error('gis_not_ready');

      // Silent detection: if this browser already has a Google session and
      // already granted this app access to YouTube, no consent UI is shown.
      try {
        await tokenRequest('none');
        try {
          if (await checkOwnerChannel()) {
            ownerDetected = true;
            const d = t();
            refreshTexts();
            setStatus(null, d.ownerDetail || d.owner);
            hideWall('owner');
            return;
          }
        } catch (ownerError) {
          if (ownerError.message === 'unauthorized') throw ownerError;
        }
        if (await checkSubscription()) {
          hideWall('subscription');
          return;
        }
        accessToken = null;
        refreshTexts();
        setStatus('auth');
      } catch (_) {
        accessToken = null;
        refreshTexts();
        setStatus('auth');
      }

      if (!unlocked) {
        const subscribeButton = wall.querySelector('#youtubeAccessSubscribe');
        if (subscribeButton) {
          subscribeButton.disabled = false;
          subscribeButton.setAttribute('aria-disabled', 'false');
        }
      }
    } catch (_) {
      setStatus('auth');
      const subscribeButton = wall && wall.querySelector('#youtubeAccessSubscribe');
      if (subscribeButton) {
        subscribeButton.disabled = false;
        subscribeButton.setAttribute('aria-disabled', 'false');
      }
    }
  }

  document.addEventListener('kelonio:languageChanged', () => {
    refreshTexts();
  });

  document.addEventListener('DOMContentLoaded', () => { removeLegacyMemberCta(); bootstrap(); }, { once: true });
})();
