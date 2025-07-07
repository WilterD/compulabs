from flask_socketio import SocketIO

# Inicializar SocketIO como variable global
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet') 