-- Script para crear el admin por defecto
-- Ejecutar DESPUÉS del schema.sql
-- Password: 12345678 (ya hasheada con bcrypt)

INSERT IGNORE INTO usuarios (nombre, correo, password_hash, rol)
VALUES (
  'Administrador',
  'admin@gmail.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);

-- Nota: el hash corresponde a "12345678"
-- Si quieres cambiar la contraseña, genera un nuevo hash con bcrypt
