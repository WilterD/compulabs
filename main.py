import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from db import db
from auth import auth_bp
from lab import lab_bp
from computer import computer_bp
from reservation import reservation_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
CORS(app)  # Habilitar CORS para permitir solicitudes desde el frontend
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Registrar blueprints para cada microservicio
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(lab_bp, url_prefix='/api/labs')
app.register_blueprint(computer_bp, url_prefix='/api/computers')
app.register_blueprint(reservation_bp, url_prefix='/api/reservations')

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:"
    f"{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:"
    f"{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'mydb')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Sistema de reservas funcionando correctamente"})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Crear tablas al iniciar la aplicación
    app.run(host='0.0.0.0', port=5000, debug=True)
