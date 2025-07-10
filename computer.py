from datetime import datetime
from flask import Blueprint, jsonify, request
from auth import token_required
from db import db
from socket_manager import socketio

computer_bp = Blueprint('computers', __name__)

class Computer(db.Model):
    __tablename__ = 'computers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    hostname = db.Column(db.String(100), unique=True, nullable=False)
    specs = db.Column(db.Text)  # JSON con especificaciones técnicas
    status = db.Column(db.String(20), default='available')  # 'available', 'maintenance', 'reserved'
    laboratory_id = db.Column(db.Integer, db.ForeignKey('laboratories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    reservations = db.relationship('Reservation', backref='computers', lazy=True)
    
    def __repr__(self):
        return f'<Computer {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'hostname': self.hostname,
            'specs': self.specs,
            'status': self.status,
            'laboratory_id': self.laboratory_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Obtener todas las computadoras
@computer_bp.route('/', methods=['GET'])
def get_all_computers():
    computers = Computer.query.all()
    return jsonify([computer.to_dict() for computer in computers])

# Obtener computadoras disponibles
@computer_bp.route('/available', methods=['GET'])
def get_available_computers():
    available_computers = Computer.query.filter_by(status='available').all()
    return jsonify([computer.to_dict() for computer in available_computers])

# Obtener computadoras por laboratorio
@computer_bp.route('/laboratory/<int:laboratory_id>', methods=['GET'])
def get_computers_by_laboratory(laboratory_id):
    computers = Computer.query.filter_by(laboratory_id=laboratory_id).all()
    return jsonify([computer.to_dict() for computer in computers])

@computer_bp.route('/<int:computer_id>', methods=['GET'])
def get_computer_by_id(computer_id):
    computer = Computer.query.get(computer_id)
    if not computer:
        return jsonify({'error': 'Computer not found'}), 404
    return jsonify(computer.to_dict())

# Test endpoint para emitir evento manualmente
@computer_bp.route('/test-emit', methods=['POST'])
def test_emit():
    print("🧪 TEST: Emitiendo evento de prueba")
    socketio.emit('computer_status_updated', {
        'computer_id': 1,
        'old_status': 'available',
        'new_status': 'maintenance',
        'laboratory_id': 1
    })
    print("✅ TEST: Evento de prueba emitido")
    return jsonify({'message': 'Evento de prueba emitido'})

# Actualizar estado de computadora (solo admin)
@computer_bp.route('/<int:computer_id>/status', methods=['PUT'])
@token_required
def update_computer_status(current_user, computer_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['available', 'maintenance', 'reserved']:
        return jsonify({'message': 'Estado inválido'}), 400

    computer = Computer.query.get(computer_id)
    if not computer:
        return jsonify({'message': 'Computadora no encontrada'}), 404

    old_status = computer.status
    computer.status = new_status
    db.session.commit()

    # Emitir evento de actualización en tiempo real
    print(f"🔔 EMITIENDO EVENTO: computer_status_updated")
    print(f"   - Computer ID: {computer_id}")
    print(f"   - Estado anterior: {old_status}")
    print(f"   - Estado nuevo: {new_status}")
    print(f"   - Laboratory ID: {computer.laboratory_id}")
    
    socketio.emit('computer_status_updated', {
        'computer_id': computer_id,
        'old_status': old_status,
        'new_status': new_status,
        'laboratory_id': computer.laboratory_id
    })
    
    print(f"✅ Evento computer_status_updated emitido exitosamente")

    return jsonify({'message': f'Estado de computadora {computer_id} actualizado a {new_status}', 'computer': computer.to_dict()})

@computer_bp.route('/<int:computer_id>', methods=['DELETE'])
@token_required
def delete_computer(current_user, computer_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    computer = Computer.query.get(computer_id)
    if not computer:
        return jsonify({'message': 'Computadora no encontrada'}), 404

    laboratory_id = computer.laboratory_id
    
    try:
        db.session.delete(computer)
        db.session.commit()
        
        # Emitir evento de eliminación en tiempo real
        socketio.emit('computer_deleted', {
            'computer_id': computer_id,
            'laboratory_id': laboratory_id
        })
        
        return jsonify({'message': f'Computadora {computer_id} eliminada correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500