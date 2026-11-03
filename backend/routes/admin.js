const express = require('express');
const db = require('../database');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/pendientes — planes personales en espera de revisión
router.get('/pendientes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [planes] = await db.query(
      `SELECT p.*, u.nombre AS organizador_nombre, u.correo AS organizador_correo
       FROM planes p
       JOIN usuarios u ON p.organizador_id = u.id
       WHERE p.tipo = 'personal' AND p.estado = 'pendiente'
       ORDER BY p.creado_en ASC`
    );
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener planes pendientes.' });
  }
});

// GET /api/admin/todos — todos los planes (panel admin)
router.get('/todos', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [planes] = await db.query(
      `SELECT p.*, u.nombre AS organizador_nombre, u.correo AS organizador_correo
       FROM planes p
       JOIN usuarios u ON p.organizador_id = u.id
       ORDER BY p.creado_en DESC`
    );
    res.json(planes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener todos los planes.' });
  }
});

// PUT /api/admin/planes/:id/aprobar — aprobar plan personal (pasa a ser 'base' aprobado)
router.put('/planes/:id/aprobar', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [resultado] = await db.query(
      `UPDATE planes SET estado = 'aprobado', tipo = 'base' WHERE id = ? AND tipo = 'personal'`,
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o ya procesado.' });
    }

    res.json({ mensaje: 'Plan aprobado. Ahora es un plan base visible para todos.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar el plan.' });
  }
});

// PUT /api/admin/planes/:id/rechazar — rechazar plan personal
router.put('/planes/:id/rechazar', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [resultado] = await db.query(
      `UPDATE planes SET estado = 'rechazado' WHERE id = ? AND tipo = 'personal'`,
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o ya procesado.' });
    }

    res.json({ mensaje: 'Plan rechazado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al rechazar el plan.' });
  }
});

// GET /api/admin/usuarios — lista de usuarios
router.get('/usuarios', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [usuarios] = await db.query(
      'SELECT id, nombre, correo, rol, creado_en FROM usuarios ORDER BY creado_en DESC'
    );
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

module.exports = router;
