import requests
import random
import json

# Configuración
WEBHOOK_URL = "TU_URL_DE_WEBHOOK_DE_DISCORD"
ARCHIVOS = ['switch.json', 'playstation.json', 'xbox.json', '3ds.json', 'nds.json', 'wii_wii_u.json', 'sd_usb.json']
BASE_URL = "https://raw.githubusercontent.com/Kelonio-hub/Link-3DS/main/"

def obtener_productos():
    todos = []
    for archivo in ARCHIVOS:
        try:
            resp = requests.get(BASE_URL + archivo).json()
            todos.extend(resp)
        except: continue
    return todos

def enviar_a_discord(productos):
    embeds = []
    for p in productos[:5]:
        embeds.append({
            "title": p.get('label', {}).get('es', 'Producto'),
            "description": p.get('desc', {}).get('es', 'Sin descripción'),
            "url": p.get('url'),
            "image": {"url": p.get('img')}
        })
    requests.post(WEBHOOK_URL, json={"content": "🔥 **Productos destacados del día:**", "embeds": embeds})

productos = obtener_productos()
seleccion = random.sample(productos, min(5, len(productos)))
enviar_a_discord(seleccion)