from datetime import datetime
from flask import Blueprint, jsonify, request
from auth import token_required
from db import db

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

# Actualizar estado de computadora (solo admin)
@computer_bp.route('/<int:computer_id>/status', methods=['PUT'])
@token_required
def update_computer_status(current_user, computer_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['available', 'maintenance', 'reserved']
    if new_status not in valid_statuses:
        return jsonify({'message': 'Estado inválido'}), 400

    computer = Computer.query.get(computer_id)
    if not computer:
        return jsonify({'message': 'Computadora no encontrada'}), 404

    computer.status = new_status
    db.session.commit()

    return jsonify({'message': f'Computadora {computer_id} actualizada a {new_status}', 'computer': computer.to_dict()})