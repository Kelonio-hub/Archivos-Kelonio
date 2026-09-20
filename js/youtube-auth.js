/* Kelonio — Muro de acceso por membresía de YouTube
 *
 * Flujo:
 *  1. Si existe una autorización local válida (<24 h), se desbloquea la guía.
 *  2. Si no existe, se muestra un muro.
 *  3. El usuario pulsa "Hacerse miembro" y se abre el canal de Kelonio en
 *     una pestaña nueva.
 *  4. Comienza una cuenta atrás de 60 segundos.
 *  5. Al finalizar los 60 segundos, se guarda el acceso durante 24 horas
 *     y se desbloquea la guía.
 *
 * IMPORTANTE:
 * Este sistema ya no usa Google OAuth ni YouTube Data API. El acceso se basa
 * en la espera de 60 segundos y en un caché local de 24 horas.
 */

(function () {
  'use strict';

  if (window.__kelonioYoutubeWallLoaded) return;
  window.__kelonioYoutubeWallLoaded = true;

  const C = window.KELONIO_YOUTUBE_CONFIG || {};
  const CHANNEL_URL = String(
    C.joinUrl || 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw/join'
  );

  const CACHE_KEY = 'kelonio.youtube.access.v12';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const WAIT_MS = 60 * 1000;

  const DICT = {
    es: {
      title: 'Acceso a la guía',
      member: 'Suscribirse',
      memberAria: 'Suscribirse al canal de YouTube de Kelonio',
      success: 'Acceso concedido. Abriendo la guía…',
    },
    en: {
      title: 'Guide access',
      member: 'Become a member',
      memberAria: 'Become a member of the Kelonio YouTube channel',
      success: 'Access granted. Opening the guide…',
    },
    fr: {
      title: 'Accès au guide',
      member: 'Devenir membre',
      memberAria: 'Devenir membre de la chaîne YouTube de Kelonio',
      success: 'Accès accordé. Ouverture du guide…',
    },
    de: {
      title: 'Zugriff auf die Anleitung',
      member: 'Mitglied werden',
      memberAria: 'Mitglied des Kelonio-YouTube-Kanals werden',
      success: 'Zugriff gewährt. Anleitung wird geöffnet…',
    },
    it: {
      title: 'Accesso alla guida',
      member: 'Diventa membro',
      memberAria: 'Diventa membro del canale YouTube di Kelonio',
      success: 'Accesso concesso. Apertura della guida…',
    },
    pt: {
      title: 'Acesso ao guia',
      member: 'Tornar-se membro',
      memberAria: 'Tornar-se membro do canal do YouTube de Kelonio',
      success: 'Acesso concedido. A abrir o guia…',
    },
    ja: {
      title: 'ガイドへのアクセス',
      member: 'メンバーになる',
      memberAria: 'Kelonio YouTube チャンネルのメンバーになる',
      success: 'アクセスが許可されました。ガイドを開きます…',
    },
    ko: {
      title: '가이드 이용',
      member: '멤버 되기',
      memberAria: 'Kelonio YouTube 채널의 멤버 되기',
      success: '접근이 허용되었습니다. 가이드를 엽니다…',
    }
  };

  let wall = null;
  let unlocked = false;
  let busy = false;
  let countdownTimer = null;
  let countdownEndsAt = 0;

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
        verifiedAt
      };
    } catch (_) {
      return null;
    }
  }

  function writeAccessCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: 12,
        verified: true,
        verifiedAt: Date.now()
      }));
    } catch (_) {}
  }

  function lang() {
    try {
      const l = typeof window.idiomaActual === 'string' ? window.idiomaActual : '';
      if (l && DICT[l]) return l;
    } catch (_) {}

    const raw = String(
      document.documentElement.lang || navigator.language || 'es'
    ).toLowerCase();

    const k = raw.split('-')[0];
    return DICT[k] ? k : 'es';
  }

  function t() {
    return DICT[lang()] || DICT.es;
  }

  function buildWall() {
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
        <div class="youtube-access-icon" aria-hidden="true">★</div>
        <h1 id="youtubeAccessTitle"></h1>
        </div>

        <button type="button"
                class="youtube-access-btn"
                id="youtubeAccessMember"></button>
      </div>
    `;

    injectStyles();
    refreshTexts();

    const button = wall.querySelector('#youtubeAccessMember');
    if (button) {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
    }

    return wall;
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
        background: rgba(8,9,12,.96);
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
        padding: 42px 34px 32px;
        text-align: center;
        border-radius: 24px;
        background: linear-gradient(180deg,rgba(28,31,39,.98),rgba(18,20,26,.98));
        border: 1px solid rgba(255,255,255,.12);
        box-shadow:
          0 25px 80px rgba(0,0,0,.45),
          0 0 0 1px rgba(229,9,20,.06);
      }

      .youtube-access-icon {
        width: 62px;
        height: 62px;
        margin: 0 auto 22px;
        border-radius: 50%;
        background: #e50914;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
        font-weight: 900;
        box-shadow: 0 10px 30px rgba(229,9,20,.3);
      }

      .youtube-access-card h1 {
        margin: 0 0 12px;
        font-size: clamp(1.65rem,4vw,2.2rem);
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
        font: 900 1rem/1.2 'Segoe UI',system-ui,sans-serif;
        cursor: pointer;
        box-shadow: 0 10px 26px rgba(229,9,20,.25);
        transition:
          transform .18s ease,
          filter .18s ease,
          box-shadow .18s ease;
      }

      .youtube-access-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.08);
        box-shadow: 0 14px 32px rgba(229,9,20,.34);
      }

      .youtube-access-btn:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
      }

      .youtube-access-btn:disabled {
        opacity: .72;
        cursor: wait;
      }
.youtube-access-youtube:hover {
        text-decoration: underline;
        color: #fff;
      }
@media(max-width:600px) {
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
    const q = (id) => wall.querySelector('#' + id);

    if (q('youtubeAccessTitle')) {
      q('youtubeAccessTitle').textContent = d.title;
    }

    const button = q('youtubeAccessMember');
    if (button) {
      button.textContent = d.member;
      button.disabled = busy || unlocked;
      button.setAttribute(
        'aria-label',
        d.memberAria
      );
    }
  }
  }

  function openChannel() {
    /*
     * Se abre en una pestaña nueva para que la guía siga activa y pueda
     * completar la cuenta atrás de 60 segundos.
     */
    try {
      const popup = window.open(
        CHANNEL_URL,
        '_blank',
        'noopener,noreferrer'
      );

      if (!popup) {
        const link = wall && wall.querySelector('#youtubeAccessOpenYoutube');
        if (link) link.click();
        return false;
      }

      try {
        popup.opener = null;
      } catch (_) {}

      return true;
    } catch (_) {
      const link = wall && wall.querySelector('#youtubeAccessOpenYoutube');
      if (link) link.click();
      return false;
    }
  }

  function finishAccess() {
    if (unlocked) return;

    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }

    countdownEndsAt = 0;
    busy = false;
    unlocked = true;

    writeAccessCache();

    document.documentElement.classList.remove('youtube-wall-locked');
    document.body.classList.remove('youtube-wall-locked');

    const button = wall && wall.querySelector('#youtubeAccessMember');
    if (button) {
      button.disabled = true;
      button.textContent = d.ready;
    }

    if (wall) {
      wall.classList.add('youtube-wall-hidden');
      window.setTimeout(() => {
        if (wall) wall.remove();
      }, 380);
    }

    showMemberCta();

    document.dispatchEvent(new CustomEvent('kelonio:youtubeAccessGranted', {
    }));
  }

  function startCountdown() {
    if (busy || unlocked) return;

    busy = true;
    countdownEndsAt = Date.now() + WAIT_MS;

    const button = wall && wall.querySelector('#youtubeAccessMember');
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    function tick() {
      const remaining = getRemainingSeconds();
      const elapsed = Math.max(0, WAIT_MS - Math.max(0, countdownEndsAt - Date.now()));
      const percent = (elapsed / WAIT_MS) * 100;

      if (remaining <= 0) {
        finishAccess();
      }
    }

    tick();
    countdownTimer = window.setInterval(tick, 250);
  }

  function handleMemberClick() {
    if (busy || unlocked) return;

    openChannel();
    startCountdown();
  }

  function showMemberCta() {
    const videos = Array.from(
      document.querySelectorAll('.guide-content .video-container')
    );

    if (!videos.length || document.getElementById('youtube-cta-box')) return;

    const last = videos[videos.length - 1];
    const box = document.createElement('section');

    box.id = 'youtube-cta-box';
    box.className = 'youtube-cta-box';
    box.innerHTML = `
      <div class="youtube-cta-actions">
        <a class="youtube-cta-member"
           target="_blank"
           rel="noopener noreferrer sponsored"></a>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .youtube-cta-box {
        width: 100%;
        margin: 4px 0 30px;
        padding: 17px 0 5px;
        border-top: 1px solid var(--glass-border);
        text-align: center;
      }

      .youtube-cta-member {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 11px 18px;
        border-radius: 10px;
        background: var(--red);
        color: #fff !important;
        text-decoration: none !important;
        font: 900 .86rem/1.15 'Segoe UI',system-ui,sans-serif;
        box-shadow: 0 6px 18px rgba(0,0,0,.18);
        transition: filter .18s ease, transform .18s ease;
      }

      .youtube-cta-member:hover {
        filter: brightness(1.08);
        transform: translateY(-2px);
      }

      .youtube-cta-member:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 3px;
      }
    `;

    box.appendChild(style);
    last.insertAdjacentElement('afterend', box);

    const link = box.querySelector('.youtube-cta-member');
    if (!link) return;

    link.href = CHANNEL_URL;
    link.textContent = t().member;
    link.setAttribute('aria-label', t().memberAria);
  }

  function unlockFromCache(cached) {
    if (!cached || !cached.verified) return;

    unlocked = true;

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

    showMemberCta();

    document.dispatchEvent(new CustomEvent('kelonio:youtubeAccessGranted', {
        source: 'local-cache-24h'
      }
    }));
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

    const cached = readAccessCache();

    if (cached && cached.verified) {
      unlockFromCache(cached);
      return;
    }

    buildWall();
    showWall();

    const button = wall.querySelector('#youtubeAccessMember');

    if (button) {
      button.addEventListener('click', handleMemberClick);
    }
  }

  document.addEventListener('kelonio:languageChanged', () => {
    refreshTexts();

    const member = document.querySelector(
      '#youtube-cta-box .youtube-cta-member'
    );

    if (member) {
      member.textContent = t().member;
      member.setAttribute('aria-label', t().memberAria);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  });

  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
})();
