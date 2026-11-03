const express = require('express');
const db = require('../database');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/votos/:planId — obtener conteo de votos de un plan
router.get('/:planId', verificarToken, async (req, res) => {
  try {
    const planId = req.params.planId;

    const [conteo] = await db.query(
      `SELECT
        SUM(voto = 'si') AS votos_si,
        SUM(voto = 'no') AS votos_no,
        COUNT(*) AS total
       FROM votos WHERE plan_id = ?`,
      [planId]
    );

    // Voto del usuario actual
    const [miVoto] = await db.query(
      'SELECT voto FROM votos WHERE plan_id = ? AND usuario_id = ?',
      [planId, req.usuario.id]
    );

    res.json({
      votos_si: Number(conteo[0].votos_si) || 0,
      votos_no: Number(conteo[0].votos_no) || 0,
      total: Number(conteo[0].total) || 0,
      mi_voto: miVoto.length > 0 ? miVoto[0].voto : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener votos.' });
  }
});

// POST /api/votos/:planId — votar (o cambiar voto)
router.post('/:planId', verificarToken, async (req, res) => {
  const { voto } = req.body;
  const planId = req.params.planId;

  if (voto !== 'si' && voto !== 'no') {
    return res.status(400).json({ error: 'El voto debe ser "si" o "no".' });
  }

  try {
    // Verificar que el plan existe y está aprobado
    const [planes] = await db.query(
      "SELECT id FROM planes WHERE id = ? AND estado = 'aprobado'",
      [planId]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o no disponible para votar.' });
    }

    // INSERT o UPDATE del voto (ON DUPLICATE KEY)
    await db.query(
      `INSERT INTO votos (plan_id, usuario_id, voto)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE voto = VALUES(voto)`,
      [planId, req.usuario.id, voto]
    );

    // Devolver conteo actualizado
    const [conteo] = await db.query(
      `SELECT
        SUM(voto = 'si') AS votos_si,
        SUM(voto = 'no') AS votos_no,
        COUNT(*) AS total
       FROM votos WHERE plan_id = ?`,
      [planId]
    );

    res.json({
      votos_si: Number(conteo[0].votos_si) || 0,
      votos_no: Number(conteo[0].votos_no) || 0,
      total: Number(conteo[0].total) || 0,
      mi_voto: voto
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el voto.' });
  }
});

// DELETE /api/votos/:planId — quitar voto
router.delete('/:planId', verificarToken, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM votos WHERE plan_id = ? AND usuario_id = ?',
      [req.params.planId, req.usuario.id]
    );
    res.json({ mensaje: 'Voto eliminado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el voto.' });
  }
});

module.exports = router;
