#!/bin/bash

# Script para pruebas unitarias del backend

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando pruebas unitarias del backend...${NC}"

# Directorio base del proyecto
PROJECT_DIR="/home/ubuntu/proyecto_reservas_lab"
BACKEND_DIR="$PROJECT_DIR/backend/reservas_app"

cd $BACKEND_DIR

# Crear directorio de pruebas si no existe
mkdir -p tests

# Crear archivo de pruebas para modelos
cat > tests/test_models.py << 'EOF'
import sys
import os
import unittest
from datetime import datetime, timedelta

# Agregar el directorio src al path para importar los módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import db
from user import User
from laboratory import Laboratory
from computer import Computer
from reservation import Reservation
from src.main import app

class TestModels(unittest.TestCase):
    def setUp(self):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
        self.app = app.test_client()
        with app.app_context():
            db.create_all()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_user_model(self):
        with app.app_context():
            user = User(
                email='test@example.com',
                password='password',
                name='Test',
                role='student'
            )
            db.session.add(user)
            db.session.commit()
            
            saved_user = User.query.filter_by(email='test@example.com').first()
            self.assertIsNotNone(saved_user)
            self.assertEqual(saved_user.name, 'Test')
            self.assertEqual(saved_user.role, 'student')
    
    def test_laboratory_model(self):
        with app.app_context():
            lab = Laboratory(
                name='Test Lab',
                location='Building A',
                capacity=20,
                opening_time=datetime.now().time(),
                closing_time=(datetime.now() + timedelta(hours=8)).time(),
                description='Test laboratory'
            )
            db.session.add(lab)
            db.session.commit()
            
            saved_lab = Laboratory.query.filter_by(name='Test Lab').first()
            self.assertIsNotNone(saved_lab)
            self.assertEqual(saved_lab.location, 'Building A')
            self.assertEqual(saved_lab.capacity, 20)
    
    def test_computer_model(self):
        with app.app_context():
            # Crear laboratorio primero
            lab = Laboratory(
                name='Test Lab',
                location='Building A',
                capacity=20,
                opening_time=datetime.now().time(),
                closing_time=(datetime.now() + timedelta(hours=8)).time()
            )
            db.session.add(lab)
            db.session.commit()
            
            # Crear computadora
            computer = Computer(
                name='PC-001',
                hostname='pc001.lab.edu',
                specs='{"description": "Intel i7, 16GB RAM"}',
                status='available',
                laboratory_id=lab.id
            )
            db.session.add(computer)
            db.session.commit()
            
            saved_computer = Computer.query.filter_by(name='PC-001').first()
            self.assertIsNotNone(saved_computer)
            self.assertEqual(saved_computer.hostname, 'pc001.lab.edu')
            self.assertEqual(saved_computer.status, 'available')
            self.assertEqual(saved_computer.laboratory_id, lab.id)
    
    def test_reservation_model(self):
        with app.app_context():
            # Crear usuario
            user = User(
                email='test@example.com',
                password='password',
                name='Test',
                role='student'
            )
            db.session.add(user)
            
            # Crear laboratorio
            lab = Laboratory(
                name='Test Lab',
                location='Building A',
                capacity=20,
                opening_time=datetime.now().time(),
                closing_time=(datetime.now() + timedelta(hours=8)).time()
            )
            db.session.add(lab)
            db.session.commit()
            
            # Crear computadora
            computer = Computer(
                name='PC-001',
                hostname='pc001.lab.edu',
                specs='{"description": "Intel i7, 16GB RAM"}',
                status='available',
                laboratory_id=lab.id
            )
            db.session.add(computer)
            db.session.commit()
            
            # Crear reserva
            start_time = datetime.now() + timedelta(hours=1)
            end_time = start_time + timedelta(hours=2)
            reservation = Reservation(
                start_time=start_time,
                end_time=end_time,
                status='confirmed',
                user_id=user.id,
                computer_id=computer.id
            )
            db.session.add(reservation)
            db.session.commit()
            
            saved_reservation = Reservation.query.filter_by(user_id=user.id).first()
            self.assertIsNotNone(saved_reservation)
            self.assertEqual(saved_reservation.status, 'confirmed')
            self.assertEqual(saved_reservation.computer_id, computer.id)

if __name__ == '__main__':
    unittest.main()
EOF

# Crear archivo de pruebas para rutas
cat > tests/test_routes.py << 'EOF'
import sys
import os
import unittest
import json
from datetime import datetime, timedelta

# Agregar el directorio src al path para importar los módulos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import db
from user import User
from laboratory import Laboratory
from computer import Computer
from src.main import app

class TestRoutes(unittest.TestCase):
    def setUp(self):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test_secret_key'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()
            
            # Crear usuario administrador para pruebas
            admin = User(
                email='admin@example.com',
                password='$2b$12$tPHGOHQNmIlAJCjmV5vHxOUmB4KEy6HoGfLAQ/J3qqOFXGsA.YOLi',  # 'admin123' hasheado
                name='Admin',
                role='admin'
            )
            db.session.add(admin)
            
            # Crear usuario estudiante para pruebas
            student = User(
                email='student@example.com',
                password='$2b$12$tPHGOHQNmIlAJCjmV5vHxOUmB4KEy6HoGfLAQ/J3qqOFXGsA.YOLi',  # 'admin123' hasheado
                name='Student',
                role='student'
            )
            db.session.add(student)
            
            # Crear laboratorio para pruebas
            lab = Laboratory(
                name='Test Lab',
                location='Building A',
                capacity=20,
                opening_time=datetime.now().time(),
                closing_time=(datetime.now() + timedelta(hours=8)).time(),
                description='Test laboratory'
            )
            db.session.add(lab)
            db.session.commit()
            
            # Crear computadora para pruebas
            computer = Computer(
                name='PC-001',
                hostname='pc001.lab.edu',
                specs='{"description": "Intel i7, 16GB RAM"}',
                status='available',
                laboratory_id=lab.id
            )
            db.session.add(computer)
            db.session.commit()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_health_endpoint(self):
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')
    
    def test_login_endpoint(self):
        response = self.app.post('/api/auth/login',
                               data=json.dumps({'email': 'admin@example.com', 'password': 'admin123'}),
                               content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('token', data)
    
    def test_get_labs_endpoint(self):
        response = self.app.get('/api/labs')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Test Lab')
    
    def test_get_computers_endpoint(self):
        response = self.app.get('/api/computers')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'PC-001')
    
    def test_get_computers_by_lab_endpoint(self):
        # Obtener el ID del laboratorio
        lab_response = self.app.get('/api/labs')
        lab_data = json.loads(lab_response.data)
        lab_id = lab_data[0]['id']
        
        response = self.app.get(f'/api/computers/laboratory/{lab_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['laboratory_id'], lab_id)

if __name__ == '__main__':
    unittest.main()
EOF

# Ejecutar pruebas unitarias
echo -e "${YELLOW}Ejecutando pruebas unitarias...${NC}"
cd $BACKEND_DIR
python -m unittest discover tests

# Verificar resultado de las pruebas
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Todas las pruebas unitarias pasaron exitosamente${NC}"
else
  echo -e "${RED}✗ Algunas pruebas unitarias fallaron${NC}"
fi

echo -e "${YELLOW}Pruebas unitarias completadas.${NC}"
