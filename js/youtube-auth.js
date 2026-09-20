/*
 * Kelonio — Muro de acceso por suscripción/membresía
 *
 * Funcionamiento:
 * - Muestra únicamente "Acceso a la guía" y el botón "Suscribirse".
 * - El botón abre directamente la página /join de Kelonio en una pestaña nueva.
 * - Tras 60 segundos se concede el acceso.
 * - El acceso queda guardado en caché durante 24 horas.
 * - No usa OAuth, tokens ni YouTube Data API.
 */

(function () {
  'use strict';

  if (window.__kelonioYoutubeWallLoaded) return;
  window.__kelonioYoutubeWallLoaded = true;

  const CONFIG = window.KELONIO_YOUTUBE_CONFIG || {};
  const JOIN_URL = String(
    CONFIG.joinUrl ||
    'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw/join'
  );

  const CACHE_KEY = 'kelonio.youtube.access.v13';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const WAIT_MS = 60 * 1000;

  const DICT = {
    es: {
      title: 'Acceso a la guía',
      subscribe: 'Suscribirse',
      aria: 'Suscribirse al canal de YouTube de Kelonio'
    },
    en: {
      title: 'Guide access',
      subscribe: 'Subscribe',
      aria: 'Subscribe to the Kelonio YouTube channel'
    },
    fr: {
      title: 'Accès au guide',
      subscribe: 'S’abonner',
      aria: 'S’abonner à la chaîne YouTube de Kelonio'
    },
    de: {
      title: 'Zugriff auf die Anleitung',
      subscribe: 'Abonnieren',
      aria: 'Den Kelonio-YouTube-Kanal abonnieren'
    },
    it: {
      title: 'Accesso alla guida',
      subscribe: 'Iscriviti',
      aria: 'Iscriviti al canale YouTube di Kelonio'
    },
    pt: {
      title: 'Acesso ao guia',
      subscribe: 'Subscrever',
      aria: 'Subscrever o canal do YouTube de Kelonio'
    },
    ja: {
      title: 'ガイドへのアクセス',
      subscribe: 'チャンネル登録',
      aria: 'Kelonio YouTube チャンネルに登録'
    },
    ko: {
      title: '가이드 이용',
      subscribe: '구독하기',
      aria: 'Kelonio YouTube 채널 구독하기'
    }
  };

  let wall = null;
  let unlocked = false;
  let waiting = false;
  let waitTimer = null;
  let waitEndsAt = 0;

  function getLanguage() {
    try {
      const current = window.idiomaActual;
      if (typeof current === 'string' && DICT[current]) return current;
    } catch (_) {}

    const raw = String(
      document.documentElement.lang ||
      navigator.language ||
      'es'
    ).toLowerCase();

    const code = raw.split('-')[0];
    return DICT[code] ? code : 'es';
  }

  function t() {
    return DICT[getLanguage()] || DICT.es;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      const verifiedAt = Number(data && data.verifiedAt || 0);

      if (
        !data ||
        data.verified !== true ||
        !verifiedAt ||
        Date.now() - verifiedAt < 0 ||
        Date.now() - verifiedAt >= CACHE_TTL_MS
      ) {
        localStorage.removeItem(CACHE_KEY);
        return false;
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: 13,
        verified: true,
        verifiedAt: Date.now()
      }));
    } catch (_) {}
  }

  function clearLegacyStaticWall() {
    /*
     * La plantilla de las guías puede traer un muro estático antiguo.
     * buildWall() lo reutiliza y sustituye completamente su contenido.
     */
    const existing = document.getElementById('accessWallOverlay');
    if (existing) {
      existing.classList.remove('youtube-wall-hidden');
      existing.innerHTML = '';
    }
    return existing;
  }

  function injectStyles() {
    if (document.getElementById('kelonio-youtube-wall-style')) return;

    const style = document.createElement('style');
    style.id = 'kelonio-youtube-wall-style';
    style.textContent = `
      html.youtube-wall-locked,
      body.youtube-wall-locked {
        overflow: hidden !important;
      }

      #accessWallOverlay {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: rgba(8, 9, 12, .96);
        backdrop-filter: blur(12px);
        color: #fff;
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition: opacity .35s ease, visibility .35s ease;
      }

      #accessWallOverlay.youtube-wall-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .youtube-access-card {
        width: min(92vw, 560px);
        box-sizing: border-box;
        padding: 42px 34px 34px;
        text-align: center;
        border-radius: 24px;
        background: linear-gradient(
          180deg,
          rgba(28, 31, 39, .98),
          rgba(18, 20, 26, .98)
        );
        border: 1px solid rgba(255, 255, 255, .12);
        box-shadow:
          0 25px 80px rgba(0, 0, 0, .45),
          0 0 0 1px rgba(229, 9, 20, .06);
      }

      .youtube-access-card h1 {
        margin: 0 0 24px;
        font-size: clamp(1.65rem, 4vw, 2.2rem);
        line-height: 1.2;
        font-weight: 900;
        letter-spacing: -.4px;
        color: #fff;
      }

      .youtube-access-btn {
        width: 100%;
        border: 0;
        border-radius: 12px;
        padding: 14px 20px;
        background: #e50914;
        color: #fff;
        font: 900 1rem/1.2 'Segoe UI', system-ui, sans-serif;
        cursor: pointer;
        box-shadow: 0 10px 26px rgba(229, 9, 20, .25);
        transition:
          transform .18s ease,
          filter .18s ease,
          box-shadow .18s ease;
      }

      .youtube-access-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.08);
        box-shadow: 0 14px 32px rgba(229, 9, 20, .34);
      }

      .youtube-access-btn:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
      }

      .youtube-access-btn:disabled {
        opacity: .72;
        cursor: wait;
      }

      @media (max-width: 600px) {
        #accessWallOverlay {
          padding: 16px;
        }

        .youtube-access-card {
          padding: 34px 22px 25px;
          border-radius: 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function refreshTexts() {
    if (!wall) return;

    const d = t();
    const title = wall.querySelector('#youtubeAccessTitle');
    const button = wall.querySelector('#youtubeAccessSubscribe');

    if (title) title.textContent = d.title;

    if (button) {
      button.textContent = d.subscribe;
      button.setAttribute('aria-label', d.aria);
      button.disabled = waiting || unlocked;
      button.setAttribute('aria-disabled', String(button.disabled));
    }
  }

  function buildWall() {
    wall = clearLegacyStaticWall();

    if (!wall) {
      wall = document.createElement('div');
      wall.id = 'accessWallOverlay';
      document.body.prepend(wall);
    }

    wall.setAttribute('role', 'dialog');
    wall.setAttribute('aria-modal', 'true');
    wall.setAttribute('aria-labelledby', 'youtubeAccessTitle');

    wall.innerHTML = `
      <div class="youtube-access-card" role="document">
        <h1 id="youtubeAccessTitle"></h1>
        <button
          type="button"
          class="youtube-access-btn"
          id="youtubeAccessSubscribe">
        </button>
      </div>
    `;

    injectStyles();
    refreshTexts();

    const button = wall.querySelector('#youtubeAccessSubscribe');
    if (button) {
      button.addEventListener('click', startAccess, { once: true });
    }

    return wall;
  }

  function openMembershipPage() {
    try {
      const popup = window.open(JOIN_URL, '_blank', 'noopener,noreferrer');

      if (popup) {
        try {
          popup.opener = null;
        } catch (_) {}
        return;
      }
    } catch (_) {}

    /*
     * Si el navegador bloquea window.open, usamos una navegación del enlace
     * equivalente. El enlace no se muestra como texto en el muro.
     */
    const a = document.createElement('a');
    a.href = JOIN_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }

  function startAccess() {
    if (waiting || unlocked) return;

    openMembershipPage();

    waiting = true;
    waitEndsAt = Date.now() + WAIT_MS;
    refreshTexts();

    waitTimer = window.setInterval(() => {
      if (Date.now() >= waitEndsAt) {
        finishAccess();
      }
    }, 250);
  }

  function finishAccess() {
    if (unlocked) return;

    if (waitTimer) {
      window.clearInterval(waitTimer);
      waitTimer = null;
    }

    waiting = false;
    waitEndsAt = 0;
    unlocked = true;
    writeCache();

    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');

    if (wall) {
      wall.classList.add('youtube-wall-hidden');
      window.setTimeout(() => {
        if (wall) wall.remove();
      }, 380);
    }

    document.dispatchEvent(
      new CustomEvent('kelonio:youtubeAccessGranted', {
        detail: {
          source: 'member-60s-cache-24h'
        }
      })
    );
  }

  function unlockFromCache() {
    unlocked = true;

    wall = document.getElementById('accessWallOverlay');
    if (wall) {
      wall.classList.add('youtube-wall-hidden');
      window.setTimeout(() => {
        if (wall) wall.remove();
      }, 380);
    }

    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');

    document.dispatchEvent(
      new CustomEvent('kelonio:youtubeAccessGranted', {
        detail: {
          source: 'local-cache-24h'
        }
      })
    );
  }

  function showWall() {
    if (!wall) buildWall();

    wall.classList.remove('youtube-wall-hidden');
    document.documentElement.classList.add('youtube-wall-locked');
    document.body.classList.add('youtube-wall-locked');
    refreshTexts();
  }

  function bootstrap() {
    const videos = document.querySelectorAll(
      '.guide-content .video-container'
    );

    if (!videos.length) return;

    if (readCache()) {
      unlockFromCache();
      return;
    }

    showWall();
  }

  document.addEventListener('kelonio:languageChanged', refreshTexts);

  /*
   * Funciona tanto si el script se carga antes como después de
   * DOMContentLoaded.
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }

  window.addEventListener('beforeunload', () => {
    if (waitTimer) {
      window.clearInterval(waitTimer);
      waitTimer = null;
    }
  });
})();
