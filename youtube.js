// Configuración de la API de Google/YouTube
  const CLIENT_ID = "316282527970-k8roorg133u98gcra57n8qe72bkkkbkk.apps.googleusercontent.com";
  const CHANNEL_ID = "UCJbYmHLNcrPUUA9oyBGtsKw";
  let accessToken = null;
  let tokenClient = null;

  document.getElementById('disney-btn1').onclick = function() {
      if(s1) return; 
      const btn = this;
      btn.innerText = "⏳ Conectando..."; 
      btn.style.opacity = "0.7";

      // Inicializar el cliente solo si aún no está listo y la librería ya cargó
      if (!tokenClient) {
          if (window.google && google.accounts && google.accounts.oauth2) {
              tokenClient = google.accounts.oauth2.initTokenClient({
                  client_id: CLIENT_ID,
                  scope: "https://www.googleapis.com/auth/youtube.readonly",
                  callback: (response) => {
                      accessToken = response.access_token;
                      comprobarSuscripcionDisney();
                  }
              });
          } else {
              alert("La API de Google aún está cargando. Por favor, reintenta en un segundo.");
              btn.innerText = "1. Suscribirse al canal"; 
              btn.style.opacity = "1";
              return;
          }
      }
      tokenClient.requestAccessToken();
  };
