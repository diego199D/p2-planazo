/**
 * Script de inicialización de la base de datos Planazo
 * Ejecutar una sola vez: node database/init.js
 * Requiere que XAMPP MySQL esté corriendo
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function init() {
  console.log('🚀 Iniciando configuración de la base de datos Planazo...\n');

  // Conectar SIN especificar database todavía
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    // Crear base de datos
    console.log('📦 Creando base de datos "planazo"...');
    await conexion.query('CREATE DATABASE IF NOT EXISTS planazo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conexion.query('USE planazo');
    console.log('   ✔ Base de datos lista\n');

    // Crear tablas
    console.log('🏗️  Creando tablas...');

    await conexion.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✔ Tabla "usuarios"');

    await conexion.query(`
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
      )
    `);
    console.log('   ✔ Tabla "planes"');

    await conexion.query(`
      CREATE TABLE IF NOT EXISTS votos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        usuario_id INT NOT NULL,
        voto ENUM('si', 'no') NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unico_voto (plan_id, usuario_id),
        FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✔ Tabla "votos"\n');

    // Crear admin
    console.log('👤 Creando usuario administrador...');
    const hash = await bcrypt.hash('12345678', 10);

    await conexion.query(
      `INSERT IGNORE INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ('Administrador', 'admin@gmail.com', ?, 'admin')`,
      [hash]
    );
    console.log('   ✔ Admin creado: admin@gmail.com / 12345678\n');

    console.log('✅ ¡Base de datos lista! Ahora puedes ejecutar: npm start\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await conexion.end();
  }
}

init();
