/*
 * Kelonio — Configuración del muro de acceso por suscripción YouTube
 *
 * El Client ID de OAuth es público por diseño en una aplicación web.
 * NO pongas aquí un Client Secret.
 *
 * En Google Cloud, el cliente OAuth debe autorizar como origen JavaScript:
 *   https://kelonio-hub.github.io
 *
 * También debe tener habilitada YouTube Data API v3.
 */
window.KELONIO_YOUTUBE_CONFIG = Object.freeze({
  clientId: '316282527970-k8roorg133u98gcra57n8qe72bkkkbkk.apps.googleusercontent.com',
  channelId: 'UCJbYmHLNcrPUUA9oyBGtsKw',
  channelUrl: 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw',
  joinUrl: 'https://www.youtube.com/channel/UCJbYmHLNcrPUUA9oyBGtsKw/join'
});
