const express = require('express');
const db = require('../database');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/planes/base — planes aprobados visibles para todos
router.get('/base', verificarToken, async (req, res) => {
  try {
    const [planes] = await db.query(
      `SELECT p.*, u.nombre AS organizador_nombre
       FROM planes p
       JOIN usuarios u ON p.organizador_id = u.id
       WHERE p.tipo = 'base' AND p.estado = 'aprobado'
       ORDER BY p.creado_en DESC`
    );
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener planes base.' });
  }
});

// GET /api/planes/personales — planes personales del usuario actual
router.get('/personales', verificarToken, async (req, res) => {
  try {
    const [planes] = await db.query(
      `SELECT p.*, u.nombre AS organizador_nombre
       FROM planes p
       JOIN usuarios u ON p.organizador_id = u.id
       WHERE p.tipo = 'personal' AND p.organizador_id = ?
       ORDER BY p.creado_en DESC`,
      [req.usuario.id]
    );
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener planes personales.' });
  }
});

// POST /api/planes — crear plan (admin crea base, usuario crea personal)
router.post('/', verificarToken, async (req, res) => {
  const { nombre, descripcion, fecha } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del plan es obligatorio.' });
  }

  // Admin puede elegir tipo, usuario siempre crea 'personal'
  const tipo = req.usuario.rol === 'admin' ? (req.body.tipo || 'base') : 'personal';
  // Admin aprueba automáticamente sus planes base
  const estado = req.usuario.rol === 'admin' ? 'aprobado' : 'pendiente';

  try {
    const [resultado] = await db.query(
      `INSERT INTO planes (nombre, descripcion, fecha, estado, tipo, organizador_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), descripcion || '', fecha || null, estado, tipo, req.usuario.id]
    );

    res.status(201).json({
      id: resultado.insertId,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      fecha: fecha || null,
      estado,
      tipo,
      organizador_id: req.usuario.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el plan.' });
  }
});

// DELETE /api/planes/:id — eliminar propio plan
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const [planes] = await db.query('SELECT * FROM planes WHERE id = ?', [req.params.id]);
    if (planes.length === 0) return res.status(404).json({ error: 'Plan no encontrado.' });

    const plan = planes[0];
    // Solo el dueño o el admin puede eliminar
    if (plan.organizador_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este plan.' });
    }

    await db.query('DELETE FROM planes WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Plan eliminado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el plan.' });
  }
});

module.exports = router;
