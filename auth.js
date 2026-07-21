const CLIENT_ID =
"316282527970-k8roorg133u98gcra57n8qe72bkkkbkk.apps.googleusercontent.com";

let accessToken = null;

const tokenClient = google.accounts.oauth2.initTokenClient({

    client_id: CLIENT_ID,

    scope:
    "https://www.googleapis.com/auth/youtube.readonly",

    callback: (response) => {

        accessToken = response.access_token;

        comprobarSuscripcion();
    }

});

document
.getElementById("loginGoogle")
.addEventListener("click", () => {

    tokenClient.requestAccessToken();

});