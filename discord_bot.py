import os
import requests
import random

# Configuración de URLs de los catálogos
BASE_URL = "https://raw.githubusercontent.com/Kelonio-hub/Link-3DS/main/"
ARCHIVOS = ['switch.json', 'playstation.json', 'xbox.json', '3ds.json', 'nds.json', 'wii_wii_u.json', 'sd_usb.json']

# Obtener el Webhook desde las variables de entorno de GitHub Actions
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")

if not WEBHOOK_URL:
    print("Error: WEBHOOK_URL no encontrada en las variables de entorno.")
    exit(1)

def obtener_productos():
    todos_los_productos = []
    for archivo in ARCHIVOS:
        try:
            # Añadir un número aleatorio para evitar que GitHub nos devuelva una versión cacheada antigua
            url = f"{BASE_URL}{archivo}?v={random.randint(1, 100000)}"
            respuesta = requests.get(url)
            if respuesta.status_code == 200:
                datos = respuesta.json()
                todos_los_productos.extend(datos)
        except Exception as e:
            print(f"Error al descargar {archivo}: {e}")
    return todos_los_productos

def enviar_a_discord(productos):
    embeds = []
    for p in productos:
        # Extraer datos adaptados a la estructura de tus JSON
        label = p.get('label', {}).get('es', 'Producto sin nombre')
        desc = p.get('desc', {}).get('es', 'Sin descripción')
        url = p.get('url', '') 
        img = p.get('img', '')
        precio = p.get('price', '')

        # Si el precio no viene como campo separado, pero está en la descripción (como en tu código HTML)
        if not precio and '\n' in desc:
            partes = desc.split('\n')
            desc = partes[0]
            precio = partes[1] if len(partes) > 1 else ''

        descripcion_final = f"{desc}\n\n**Precio:** {precio}" if precio else desc

        embeds.append({
            "title": label,
            "description": descripcion_final,
            "url": url,
            "image": {"url": img},
            "color": 15007764 # Un color rojo estilo "La Presa"
        })

    payload = {
        "content": "🔥 **¡Nuevos productos destacados del día en La Presa!** 🔥",
        "embeds": embeds
    }

    respuesta = requests.post(WEBHOOK_URL, json=payload)
    if respuesta.status_code in [200, 204]:
        print("Mensajes enviados a Discord correctamente.")
    else:
        print(f"Error al enviar a Discord: {respuesta.status_code} - {respuesta.text}")

if __name__ == "__main__":
    productos = obtener_productos()
    if not productos:
        print("No se encontraron productos para enviar.")
        exit(1)
    
    # Seleccionar 5 productos al azar filtrando los que no tengan label
    productos_validos = [p for p in productos if p.get('label') and p.get('label').get('es') != "Amazon Prime"]
    seleccion = random.sample(productos_validos, min(5, len(productos_validos)))
    
    enviar_a_discord(seleccion)
