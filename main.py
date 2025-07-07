import os
from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # <-- AÑADIDO
from db import db
from auth import auth_bp, token_required
from socket_manager import socketio
from lab import lab_bp
from computer import computer_bp
from reservation import reservation_bp
from user import User

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuración de CORS
CORS(app)

# Configuración de URL sin barras finales
app.url_map.strict_slashes = False

# Configuración base de Flask + SQLAlchemy + JWT
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['JWT_SECRET_KEY'] = 'clave-super-secreta-para-jwt'  # <-- AÑADIDO
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:" 
    f"{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:" 
    f"{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'reservas_db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar la base de datos con la app
db.init_app(app)

# Inicializar JWT
jwt = JWTManager(app)  # <-- AÑADIDO

# Inicializar SocketIO con la app
socketio.init_app(app)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(lab_bp, url_prefix='/api/labs')
app.register_blueprint(computer_bp, url_prefix='/api/computers')
app.register_blueprint(reservation_bp, url_prefix='/api/reservations')

@app.route('/api/superuser/admins', methods=['GET'])
@token_required
def listar_admins(current_user):
    if current_user.role != 'superuser':
        return jsonify({'message': 'Acceso denegado'}), 403
    admins = User.query.filter_by(role='admin').all()
    return jsonify([admin.to_dict() for admin in admins]), 200

@app.route('/api/superuser/create-admin', methods=['POST'])
@token_required
def crear_admin(current_user):
    if current_user.role != 'superuser':
        return jsonify({'message': 'Acceso denegado'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Datos incompletos'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'El usuario ya existe'}), 409

    new_user = User(
        email=data['email'],
        password=data['password'],
        name=data['name'],
        role='admin'
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Administrador creado exitosamente'}), 201


# Ruta de health-check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Sistema de reservas funcionando correctamente"})

# Fallback a SPA index.html
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


# Eventos SocketIO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', port=5000)
