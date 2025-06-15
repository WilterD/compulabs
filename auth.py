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
        except:
            return jsonify({'message': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Datos incompletos'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'El usuario ya existe'}), 409
    
    # Guardamos la contraseña en texto plano
    new_user = User(
        email=data['email'],
        password=data['password'],  # <-- contraseña sin encriptar
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
    
    # Comparamos texto plano
    if user.password == data['password']:
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
    
    if data.get('password'):
        # Guardar contraseña sin encriptar
        current_user.password = data['password']
    
    db.session.commit()
    
    return jsonify({'message': 'Perfil actualizado exitosamente', 'user': current_user.to_dict()}), 200
