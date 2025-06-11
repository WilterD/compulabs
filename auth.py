from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from db import db
from user import User

auth_bp = Blueprint('auth', __name__)

# Clave secreta para JWT
SECRET_KEY = 'your_secret_key'  # En producción, usar variable de entorno

# Decorador para rutas protegidas
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
        except:
            return jsonify({'message': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validar datos requeridos
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Datos incompletos'}), 400
    
    # Verificar si el usuario ya existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'El usuario ya existe'}), 409
    
    # Crear nuevo usuario
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')

    
    new_user = User(
        email=data['email'],
        password=hashed_password,
        name=data['name'],
        role=data.get('role', 'student')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Usuario registrado exitosamente'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Datos incompletos'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'message': 'Usuario no encontrado'}), 404
    
    if check_password_hash(user.password, data['password']):
        # Generar token JWT
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
    
    return jsonify({'message': 'Contraseña incorrecta'}), 401

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    if data.get('name'):
        current_user.name = data['name']
    
    # Actualizar contraseña si se proporciona
    if data.get('password'):
        current_user.password = generate_password_hash(data['password'], method='sha256')
    
    db.session.commit()
    
    return jsonify({'message': 'Perfil actualizado exitosamente', 'user': current_user.to_dict()}), 200
