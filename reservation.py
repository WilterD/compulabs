from datetime import datetime, time, timedelta, date
from flask import Blueprint, jsonify, request
from db import db
from auth import token_required

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

    reservation.status = new_status
    db.session.commit()

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
            Reservation.computer_id == computer_id,
            Reservation.status.in_(['pending', 'confirmed']),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time
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
        Reservation.computer_id == computer_id,
        Reservation.status.in_(['pending', 'confirmed']),
        Reservation.start_time >= datetime.combine(target_date, time(0, 0)),
        Reservation.end_time <= datetime.combine(target_date, time(23, 59, 59))
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
        Reservation.computer_id == computer_id,
        Reservation.status.in_(['pending', 'confirmed']),
        Reservation.start_time >= start_of_day,
        Reservation.start_time <= end_of_day
    ).all()

    occupied_hours = sorted({res.start_time.hour for res in reservations})
    return jsonify({'occupied_hours': occupied_hours})
