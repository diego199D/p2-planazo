-- Schema completo para Planazo multiusuario
-- Ejecutar en phpMyAdmin o MySQL CLI

CREATE DATABASE IF NOT EXISTS planazo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE planazo;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT DEFAULT '',
  fecha DATE,
  estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  tipo ENUM('base', 'personal') NOT NULL DEFAULT 'personal',
  organizador_id INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  usuario_id INT NOT NULL,
  voto ENUM('si', 'no') NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_voto (plan_id, usuario_id),
  FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
