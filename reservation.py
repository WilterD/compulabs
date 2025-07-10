from datetime import datetime, time, timedelta, date
from flask import Blueprint, jsonify, request
from db import db
from auth import token_required
from socket_manager import socketio
from computer import Computer
from sqlalchemy import and_
import requests

reservation_bp = Blueprint('reservations', __name__)

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'cancelled', 'completed'
    recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    computer_id = db.Column(db.Integer, db.ForeignKey('computers.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, start_time, end_time, status='pending', user_id=None, computer_id=None, recurring=False, recurrence_pattern=None):
        self.start_time = start_time
        self.end_time = end_time
        self.status = status
        self.user_id = user_id
        self.computer_id = computer_id
        self.recurring = recurring
        self.recurrence_pattern = recurrence_pattern
    
    def __repr__(self):
        return f'<Reservation {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'recurring': self.recurring,
            'recurrence_pattern': self.recurrence_pattern,
            'user_id': self.user_id,
            'computer_id': self.computer_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Todas las reservas (para admin)
@reservation_bp.route('/all', methods=['GET'])
@token_required
def get_all_reservations(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    reservations = Reservation.query.all()
    return jsonify([r.to_dict() for r in reservations])

# Reservas del usuario autenticado
@reservation_bp.route('/', methods=['GET'])
@token_required
def get_user_reservations(current_user):
    reservations = Reservation.query.filter_by(user_id=current_user.id).all()
    return jsonify([r.to_dict() for r in reservations])

# Actualizar estado de reserva (solo admin)
@reservation_bp.route('/<int:reservation_id>/status', methods=['PUT'])
@token_required
def update_reservation_status(current_user, reservation_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['pending', 'confirmed', 'cancelled', 'completed']:
        return jsonify({'message': 'Estado inválido'}), 400

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({'message': 'Reserva no encontrada'}), 404

    old_status = reservation.status
    reservation.status = new_status
    db.session.commit()

    # Emitir evento de actualización en tiempo real
    socketio.emit('reservation_status_updated', {
        'reservation_id': reservation_id,
        'old_status': old_status,
        'new_status': new_status,
        'user_id': reservation.user_id
    })

    return jsonify({'message': f'Reserva {reservation_id} actualizada a {new_status}', 'reservation': reservation.to_dict()})

# Cancelar reserva (usuario dueño o admin) - marca status como 'cancelled'
@reservation_bp.route('/<int:reservation_id>', methods=['DELETE'])
@token_required
def cancel_reservation(current_user, reservation_id):
    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'message': 'Reserva no encontrada'}), 404

    if reservation.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'No autorizado para cancelar esta reserva'}), 403

    if reservation.status not in ['pending', 'confirmed']:
        return jsonify({'message': 'Solo se pueden cancelar reservas pendientes o confirmadas'}), 400

    try:
        reservation.status = 'cancelled'
        db.session.commit()
        return jsonify({'message': f'Reserva {reservation_id} cancelada correctamente', 'reservation': reservation.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@reservation_bp.route('/', methods=['POST'])
@token_required
def create_reservation(current_user):
    try:
        data = request.get_json()
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')
        computer_id = data.get('computer_id')
        
        if not start_time_str or not end_time_str or not computer_id:
            return jsonify({'message': 'Faltan datos obligatorios'}), 400
        
        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)

        if start_time >= end_time:
            return jsonify({'message': 'La hora de inicio debe ser antes de la hora de fin'}), 400

        # ⛔ Verificar solapamientos (reservas pendientes o confirmadas)
        overlapping = Reservation.query.filter(
            and_(
                Reservation.computer_id == computer_id,
                Reservation.status.in_(['pending', 'confirmed']),  # type: ignore
                Reservation.start_time < end_time,  # type: ignore
                Reservation.end_time > start_time  # type: ignore
            )
        ).first()

        if overlapping:
            return jsonify({'message': 'Ya existe una reserva para esa hora'}), 409
        
        new_reservation = Reservation(
            start_time=start_time,
            end_time=end_time,
            status='pending',
            user_id=current_user.id,
            computer_id=computer_id
        )
        
        db.session.add(new_reservation)
        db.session.commit()
        
        return jsonify({'message': 'Reserva creada', 'reservation': new_reservation.to_dict()}), 201

    except Exception as e:
        print(f"Error al crear reserva: {e}")
        return jsonify({'message': 'Error interno del servidor'}), 500


# Obtener disponibilidad de un PC en una fecha específica
@reservation_bp.route('/availability', methods=['GET'])
@token_required
def get_availability(current_user):
    """
    Query params:
      - computer_id (int, requerido)
      - date (YYYY-MM-DD, requerido)
    
    Retorna un array con horas disponibles y ocupadas (7am a 6pm, intervalos de 1 hora).
    """
    computer_id = request.args.get('computer_id', type=int)
    date_str = request.args.get('date')
    
    if not computer_id or not date_str:
        return jsonify({'message': 'Faltan parámetros computer_id o date'}), 400
    
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({'message': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

    # Rango horario de 7:00 a 18:00 (6pm)
    start_hour = 7
    end_hour = 18

    # Construimos todos los intervalos horarios posibles
    slots = []
    for hour in range(start_hour, end_hour):
        slot_start = datetime.combine(target_date, time(hour, 0))
        slot_end = slot_start + timedelta(hours=1)
        slots.append({
            'start': slot_start,
            'end': slot_end,
            'available': True
        })

    # Obtenemos reservas confirmadas o pendientes en ese día y pc
    reservations = Reservation.query.filter(
        Reservation.computer_id == computer_id,  # type: ignore
        Reservation.status.in_(['pending', 'confirmed']),  # type: ignore
        Reservation.start_time >= datetime.combine(target_date, time(0, 0)),  # type: ignore
        Reservation.end_time <= datetime.combine(target_date, time(23, 59, 59))  # type: ignore
    ).all()

    # Marcar como no disponibles los slots que intersectan con reservas existentes
    for slot in slots:
        for r in reservations:
            # Si hay intersección entre slot y reserva
            if not (slot['end'] <= r.start_time or slot['start'] >= r.end_time):
                slot['available'] = False
                break

    # Convertir datetime a string ISO para frontend
    result = [
        {
            'start': s['start'].isoformat(),
            'end': s['end'].isoformat(),
            'available': s['available']
        }
        for s in slots
    ]

    return jsonify(result)

@reservation_bp.route('/occupied-hours', methods=['GET'])
@token_required
def get_occupied_hours(current_user):
    computer_id = request.args.get('computer_id', type=int)
    date_str = request.args.get('date')

    if not computer_id or not date_str:
        return jsonify({'message': 'Parámetros inválidos'}), 400

    try:
        date = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'message': 'Fecha inválida'}), 400

    start_of_day = datetime.combine(date, datetime.min.time())
    end_of_day = datetime.combine(date, datetime.max.time())

    reservations = Reservation.query.filter(
        Reservation.computer_id == computer_id,  # type: ignore
        Reservation.status.in_(['pending', 'confirmed']),  # type: ignore
        Reservation.start_time >= start_of_day,  # type: ignore
        Reservation.start_time <= end_of_day  # type: ignore
    ).all()

    occupied_hours = sorted({res.start_time.hour for res in reservations})
    return jsonify({'occupied_hours': occupied_hours})

@reservation_bp.route('/<int:reservation_id>/confirm', methods=['PUT'])
@token_required
def confirm_reservation(current_user, reservation_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({'message': 'Reserva no encontrada'}), 404

    if reservation.status != 'pending':
        return jsonify({'message': 'Solo se pueden confirmar reservas pendientes'}), 400

    # Obtener la computadora asociada
    computer = Computer.query.get(reservation.computer_id)
    if computer:
        # Cambiar el estado de la computadora a 'reserved'
        computer.status = 'reserved'
        db.session.add(computer)

    reservation.status = 'confirmed'
    db.session.commit()

    # Emitir eventos de actualización en tiempo real
    socketio.emit('reservation_status_updated', {
        'reservation_id': reservation_id,
        'new_status': 'confirmed',
        'user_id': reservation.user_id
    })

    # Emitir evento de actualización de computadora
    if computer:
        socketio.emit('computer_status_updated', {
            'computer_id': computer.id,
            'old_status': 'available',
            'new_status': 'reserved',
            'laboratory_id': computer.laboratory_id
        })

    return jsonify({'message': 'Reserva confirmada exitosamente', 'reservation': reservation.to_dict()})

@reservation_bp.route('/<int:reservation_id>/cancel', methods=['PUT'])
@token_required
def cancel_reservation_admin(current_user, reservation_id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado: se requiere rol admin'}), 403

    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({'message': 'Reserva no encontrada'}), 404

    if reservation.status not in ['pending', 'confirmed']:
        return jsonify({'message': 'No se puede cancelar una reserva ya cancelada'}), 400

    # Obtener la computadora asociada
    computer = Computer.query.get(reservation.computer_id)
    old_computer_status = computer.status if computer else None

    reservation.status = 'cancelled'
    
    # Si la computadora estaba reservada por esta reserva, cambiarla a disponible
    if computer and old_computer_status == 'reserved':
        # Verificar si hay otras reservas confirmadas para esta computadora
        other_confirmed_reservations = Reservation.query.filter(
            Reservation.computer_id == computer.id,  # type: ignore
            Reservation.status == 'confirmed',  # type: ignore
            Reservation.id != reservation_id  # type: ignore
        ).count()
        
        if other_confirmed_reservations == 0:
            computer.status = 'available'
            db.session.add(computer)

    db.session.commit()

    # Emitir eventos de actualización en tiempo real
    socketio.emit('reservation_status_updated', {
        'reservation_id': reservation_id,
        'new_status': 'cancelled',
        'user_id': reservation.user_id
    })

    # Emitir evento de actualización de computadora si cambió de estado
    if computer and old_computer_status != computer.status:
        socketio.emit('computer_status_updated', {
            'computer_id': computer.id,
            'old_status': old_computer_status,
            'new_status': computer.status,
            'laboratory_id': computer.laboratory_id
        })

    return jsonify({'message': 'Reserva cancelada exitosamente', 'reservation': reservation.to_dict()})

@reservation_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_reservations_by_id(current_user, user_id):
    # Los usuarios solo pueden ver sus propias reservas, excepto los admins
    if current_user.id != user_id and current_user.role != 'admin':
        return jsonify({'message': 'Acceso denegado'}), 403

    reservations = Reservation.query.filter_by(user_id=user_id).order_by(Reservation.created_at.desc()).all()
    
    # Obtener detalles completos para cada reserva
    reservations_with_details = []
    for reservation in reservations:
        try:
            # Obtener detalles de la computadora
            computer_response = requests.get(f'{request.host_url.rstrip("/")}/api/computers/{reservation.computer_id}')
            computer = computer_response.json() if computer_response.status_code == 200 else None
            
            # Obtener detalles del laboratorio si la computadora existe
            laboratory = None
            if computer:
                lab_response = requests.get(f'{request.host_url.rstrip("/")}/api/labs/{computer["laboratory_id"]}')
                laboratory = lab_response.json() if lab_response.status_code == 200 else None

            reservation_data = reservation.to_dict()
            reservation_data['computer'] = computer
            reservation_data['laboratory'] = laboratory
            reservations_with_details.append(reservation_data)
        except Exception as e:
            print(f"Error al obtener detalles para la reserva {reservation.id}: {e}")
            reservations_with_details.append(reservation.to_dict())

    return jsonify(reservations_with_details)
