const CHANNEL_ID =
"UCJbYmHLNcrPUUA9oyBGtsKw";

async function comprobarSuscripcion() {

    const url =
`https://www.googleapis.com/youtube/v3/subscriptions
?part=snippet
&mine=true
&forChannelId=${CHANNEL_ID}`;

    const response = await fetch(url,{

        headers:{
            Authorization:
            "Bearer " + accessToken
        }

    });

    const data = await response.json();

    console.log(data);

    if(data.items && data.items.length>0){

        alert("✅ Usuario suscrito");

        desbloquear();

    }else{

        alert("❌ No está suscrito");

    }

}