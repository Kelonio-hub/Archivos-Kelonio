/*
 * Kelonio — Configuración del muro de acceso por suscripción YouTube
 *
 * El Client ID de OAuth es público por diseño en una aplicación web.
 * NO pongas aquí un Client Secret.
 *
 * 1) En Google Cloud crea/selecciona un proyecto.
 * 2) Habilita YouTube Data API v3.
 * 3) Crea credenciales OAuth 2.0 de tipo "Aplicación web".
 * 4) Autoriza como origen JavaScript: https://kelonio-hub.github.io
 * 5) Pega aquí el Client ID.
 */
window.KELONIO_YOUTUBE_CONFIG = Object.freeze({
  clientId: 'PON_AQUI_TU_CLIENT_ID.apps.googleusercontent.com',
  channelId: 'UCJbYmHLNcrPUUA9oyBGtsKw',
  channelUrl: 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw',
  joinUrl: 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw/join'
});
