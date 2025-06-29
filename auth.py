from flask import Blueprint, request, jsonify
import jwt
import datetime
from functools import wraps
from db import db
from user import User

auth_bp = Blueprint('auth', __name__)

SECRET_KEY = 'your_secret_key'  # En producción, usa variable de entorno

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token no proporcionado'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Usuario no encontrado'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# Registro normal (solo estudiantes)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Datos incompletos'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'El usuario ya existe'}), 409

    new_user = User(
        email=data['email'],
        password=data['password'],  # <-- sin encriptar
        name=data['name'],
        role='student'
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Usuario registrado exitosamente'}), 201

# Crear admin (solo superuser)
@auth_bp.route('/create-admin', methods=['POST'])
@token_required
def create_admin(current_user):
    if current_user.role != 'superuser':
        return jsonify({'message': 'Acceso denegado: solo el superusuario puede crear administradores'}), 403

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

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Datos incompletos'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or user.password != data['password']:
        return jsonify({'message': 'Correo o contraseña incorrectos'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        'message': 'Inicio de sesión exitoso',
        'token': token,
        'user': user.to_dict()
    }), 200

# Ver perfil
@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200

# Actualizar perfil (nombre y contraseña)
@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()

    if data.get('name'):
        current_user.name = data['name']

    if data.get('password'):
        current_user.password = data['password']

    db.session.commit()

    return jsonify({'message': 'Perfil actualizado exitosamente', 'user': current_user.to_dict()}), 200
