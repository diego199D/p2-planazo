const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Completa todos los campos.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const [existentes] = await db.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, "usuario")',
      [nombre, correo, hash]
    );

    const token = jwt.sign(
      { id: resultado.insertId, nombre, correo, rol: 'usuario' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, usuario: { id: resultado.insertId, nombre, correo, rol: 'usuario' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrarse.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Completa todos los campos.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

module.exports = router;
