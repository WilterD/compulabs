from flask import Blueprint, request, jsonify
from db import db
from laboratory import Laboratory
from auth import token_required
from socket_manager import socketio

lab_bp = Blueprint('labs', __name__)  # NO url_prefix aquí

@lab_bp.route('', methods=['GET'])
def get_all_labs():
    labs = Laboratory.query.all()
    return jsonify([lab.to_dict() for lab in labs]), 200

@lab_bp.route('/<int:lab_id>', methods=['GET'])
def get_lab(lab_id):
    lab = Laboratory.query.get_or_404(lab_id)
    return jsonify(lab.to_dict()), 200

@lab_bp.route('', methods=['POST'])
@token_required
def create_lab(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'No autorizado'}), 403

    data = request.get_json()

    if not data or not data.get('name') or not data.get('location') or not data.get('capacity') or not data.get('opening_time') or not data.get('closing_time'):
        return jsonify({'message': 'Datos incompletos'}), 400

    new_lab = Laboratory(
        name=data['name'],
        location=data['location'],
        capacity=data['capacity'],
        opening_time=data['opening_time'],
        closing_time=data['closing_time'],
        description=data.get('description', '')
    )

    db.session.add(new_lab)
    db.session.commit()

    return jsonify({'message': 'Laboratorio creado exitosamente', 'laboratory': new_lab.to_dict()}), 201

@lab_bp.route('/<int:lab_id>', methods=['PUT'])
@token_required
def update_lab(current_user, lab_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'No autorizado'}), 403

    lab = Laboratory.query.get_or_404(lab_id)
    data = request.get_json()

    if data.get('name'):
        lab.name = data['name']

    if data.get('location'):
        lab.location = data['location']

    if data.get('capacity'):
        lab.capacity = data['capacity']

    if data.get('opening_time'):
        lab.opening_time = data['opening_time']

    if data.get('closing_time'):
        lab.closing_time = data['closing_time']

    if data.get('description'):
        lab.description = data['description']

    db.session.commit()

    return jsonify({'message': 'Laboratorio actualizado exitosamente', 'laboratory': lab.to_dict()}), 200

@lab_bp.route('/<int:lab_id>', methods=['DELETE'])
@token_required
def delete_lab(current_user, lab_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    lab = Laboratory.query.get(lab_id)
    if not lab:
        return jsonify({'message': 'Laboratorio no encontrado'}), 404

    try:
        db.session.delete(lab)
        db.session.commit()
        
        # Emitir evento de eliminación en tiempo real
        socketio.emit('lab_deleted', {
            'lab_id': lab_id
        })
        
        return jsonify({'message': f'Laboratorio {lab_id} eliminado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
