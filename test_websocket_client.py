#!/usr/bin/env python3
"""
Cliente de prueba para WebSockets del microservicio de notificaciones
"""

import asyncio
import websockets

async def listen():
    uri = "ws://localhost:8001/ws/2"
    async with websockets.connect(uri) as websocket:
        print("Conectado al WebSocket. Esperando notificaciones...")
        while True:
            msg = await websocket.recv()
            print(f"Notificación recibida: {msg}")

if __name__ == "__main__":
    asyncio.run(listen()) 