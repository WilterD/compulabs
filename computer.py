from datetime import datetime
from src.models.db import db

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
    reservations = db.relationship('Reservation', backref='computer', lazy=True)
    
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
