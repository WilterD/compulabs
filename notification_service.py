import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
import datetime
from typing import Dict, List

DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', 'root')
DB_HOST = os.getenv('MYSQL_HOST', 'db')
DB_NAME = os.getenv('MYSQL_DATABASE', 'reservas_db')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(String(20), default='unread')
    created_at = Column(DateTime, default=func.now())

class NotificationIn(BaseModel):
    user_id: int
    message: str
    type: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diccionario para gestionar conexiones WebSocket por usuario
active_connections: Dict[int, List[WebSocket]] = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Mantener la conexión viva
    except WebSocketDisconnect:
        active_connections[user_id].remove(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]

@app.post("/notify")
def notify(notification: NotificationIn, db=Depends(get_db)):
    # Guardar en la base de datos
    notif = Notification(
        user_id=notification.user_id,
        message=notification.message,
        type=notification.type,
        status='unread',
        created_at=datetime.datetime.now()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    # Enviar por WebSocket si el usuario está conectado
    if notification.user_id in active_connections:
        for ws in active_connections[notification.user_id]:
            try:
                import asyncio
                asyncio.create_task(ws.send_text(json.dumps({
                    "id": notif.id,
                    "message": notif.message,
                    "type": notif.type,
                    "status": notif.status,
                    "created_at": notif.created_at.isoformat()
                })))
            except Exception:
                pass
    return {"success": True, "notification_id": notif.id} 