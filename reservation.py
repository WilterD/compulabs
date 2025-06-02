from datetime import datetime
from db import db
from flask import Blueprint
reservation_bp = Blueprint('reservation', __name__)


class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'cancelled', 'completed'
    recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.String(50))  # 'daily', 'weekly', 'monthly', etc.
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
