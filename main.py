import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from db import db
from auth import auth_bp
from lab import lab_bp
from computer import computer_bp
from reservation import reservation_bp

async_mode = 'eventlet'

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Permitir CORS solo desde localhost para rutas /api/*
CORS(app, resources={r"/api/*": {"origins": "http://localhost"}})

app.url_map.strict_slashes = False

# Configuración base de Flask + SQLAlchemy
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:"
    f"{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:"
    f"{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'reservas_db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar la base de datos con la app
db.init_app(app)

# Inicializar SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=async_mode)

# Registrar blueprints con prefijos
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(lab_bp, url_prefix='/api/labs')
app.register_blueprint(computer_bp, url_prefix='/api/computers')
app.register_blueprint(reservation_bp, url_prefix='/api/reservations')

# Ruta health-check para monitoreo simple
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Sistema de reservas funcionando correctamente"})

# Servir archivos estáticos y fallback a index.html para SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    full_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    index_path = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, 'index.html')
    return "index.html not found", 404

@app.route('/api/reservations/<int:id>', methods=['DELETE'])
def delete_reservation(id):
    reservation = Reservation.query.get(id)
    if not reservation:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    db.session.delete(reservation)
    db.session.commit()

    return jsonify({'message': 'Reserva cancelada correctamente'}), 200


# Eventos SocketIO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Crea tablas si no existen
    socketio.run(app, host='0.0.0.0', port=5000)
