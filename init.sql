-- Script de inicialización de la base de datos para el Sistema de Reserva de Computadoras
-- Este script crea las tablas necesarias y añade datos iniciales para pruebas

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS reservas_db;
USE reservas_db;

-- Eliminar tablas si existen para evitar conflictos
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS computers;
DROP TABLE IF EXISTS laboratories;
DROP TABLE IF EXISTS users;

-- Crear tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('superuser', 'admin', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla de laboratorios
CREATE TABLE laboratories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla de computadoras
CREATE TABLE computers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    specs TEXT,
    status ENUM('available', 'reserved', 'maintenance') NOT NULL DEFAULT 'available',
    laboratory_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear tabla de reservas
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(255),
    user_id INT NOT NULL,
    computer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insertar usuarios de prueba
-- Contraseñas en texto plano: admin123, student123, staff123
INSERT INTO users (email, password, name, role) VALUES
('super@admin.com', 'super123', 'SuperUser', 'superuser'),
('admin@example.com', 'admin123', 'Admin', 'admin'),
('student@example.com', 'student123', 'Student', 'student');



-- Insertar laboratorios de prueba
INSERT INTO laboratories (name, location, capacity, opening_time, closing_time, description) VALUES
('Laboratorio de Informática A', 'Edificio Principal, Planta 1', 20, '08:00:00', '20:00:00', 'Laboratorio principal con computadoras de última generación'),
('Laboratorio de Programación', 'Edificio de Ingeniería, Planta 2', 15, '09:00:00', '18:00:00', 'Especializado en desarrollo de software'),
('Laboratorio de Redes', 'Edificio de Telecomunicaciones, Planta 1', 10, '10:00:00', '19:00:00', 'Equipado con routers, switches y servidores para prácticas de redes');

-- Insertar computadoras de prueba
INSERT INTO computers (name, hostname, specs, status, laboratory_id) VALUES
-- Computadoras para Laboratorio de Informática A
('PC-A01', 'pc-a01.lab.edu', '{"description": "Intel Core i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1660"}', 'available', 1),
('PC-A02', 'pc-a02.lab.edu', '{"description": "Intel Core i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1660"}', 'available', 1),
('PC-A03', 'pc-a03.lab.edu', '{"description": "Intel Core i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1660"}', 'maintenance', 1),
('PC-A04', 'pc-a04.lab.edu', '{"description": "Intel Core i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1660"}', 'available', 1),
('PC-A05', 'pc-a05.lab.edu', '{"description": "Intel Core i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1660"}', 'available', 1),

-- Computadoras para Laboratorio de Programación
('PC-P01', 'pc-p01.lab.edu', '{"description": "AMD Ryzen 7, 32GB RAM, 1TB SSD, Dual Monitor"}', 'available', 2),
('PC-P02', 'pc-p02.lab.edu', '{"description": "AMD Ryzen 7, 32GB RAM, 1TB SSD, Dual Monitor"}', 'available', 2),
('PC-P03', 'pc-p03.lab.edu', '{"description": "AMD Ryzen 7, 32GB RAM, 1TB SSD, Dual Monitor"}', 'reserved', 2),
('PC-P04', 'pc-p04.lab.edu', '{"description": "AMD Ryzen 7, 32GB RAM, 1TB SSD, Dual Monitor"}', 'available', 2),

-- Computadoras para Laboratorio de Redes
('PC-R01', 'pc-r01.lab.edu', '{"description": "Intel Core i5, 8GB RAM, 256GB SSD, Dual NIC"}', 'available', 3),
('PC-R02', 'pc-r02.lab.edu', '{"description": "Intel Core i5, 8GB RAM, 256GB SSD, Dual NIC"}', 'reserved', 3),
('PC-R03', 'pc-r03.lab.edu', '{"description": "Intel Core i5, 8GB RAM, 256GB SSD, Dual NIC"}', 'available', 3);

-- Insertar algunas reservas de ejemplo
-- Nota: Ajusta las fechas según sea necesario para tener reservas en el futuro
INSERT INTO reservations (start_time, end_time, status, user_id, computer_id) VALUES
(NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 2 HOUR, 'confirmed', 2, 1),
(NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 3 HOUR, 'pending', 2, 6),
(NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY + INTERVAL 2 HOUR, 'completed', 2, 10),

(NOW() + INTERVAL 3 DAY, NOW() + INTERVAL 3 DAY + INTERVAL 4 HOUR, 'confirmed', 3, 4),
(NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR, 'completed', 3, 7);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_computers_laboratory_id ON computers(laboratory_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_computer_id ON reservations(computer_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Crear vistas para consultas comunes
CREATE VIEW available_computers AS
SELECT c.*, l.name as laboratory_name, l.location as laboratory_location
FROM computers c
JOIN laboratories l ON c.laboratory_id = l.id
WHERE c.status = 'available';

CREATE VIEW upcoming_reservations AS
SELECT r.*, u.email as user_email, u.name, 
       c.name as computer_name, l.name as laboratory_name
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN computers c ON r.computer_id = c.id
JOIN laboratories l ON c.laboratory_id = l.id
WHERE r.start_time > NOW() AND r.status = 'confirmed';

-- Crear procedimiento almacenado para verificar disponibilidad
DELIMITER //
CREATE PROCEDURE check_computer_availability(IN computer_id INT, IN start_datetime DATETIME, IN end_datetime DATETIME)
BEGIN
    DECLARE is_available BOOLEAN;
    
    SELECT COUNT(*) = 0 INTO is_available
    FROM reservations
    WHERE computer_id = computer_id
      AND status IN ('confirmed', 'pending')
      AND ((start_time <= start_datetime AND end_time > start_datetime)
           OR (start_time < end_datetime AND end_time >= end_datetime)
           OR (start_time >= start_datetime AND end_time <= end_datetime));
    
    SELECT is_available;
END //
DELIMITER ;

-- Crear trigger para actualizar el estado de la computadora cuando se confirma una reserva
DELIMITER //
CREATE TRIGGER after_reservation_confirm
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE computers SET status = 'reserved' WHERE id = NEW.computer_id;
    ELSEIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
        UPDATE computers SET status = 'available' WHERE id = NEW.computer_id;
    END IF;
END //
DELIMITER ;

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente' AS message;
