const express = require("express");
const db = require("./database");

const router = express.Router();

router.get("/", function (req, res) {
  const organizador = req.query.organizador;

  if (!organizador) {
    res.status(400).json({ error: "Falta el organizador." });
    return;
  }

  const sql = "SELECT id, plan_id, plan_nombre, accion, fecha, organizador FROM historial WHERE organizador = ? ORDER BY id DESC";

  try {
    const registros = db.prepare(sql).all(organizador);
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: "No se pudo obtener el historial." });
  }
});

router.post("/", function (req, res) {
  const planId = req.body.plan_id;
  const planNombre = req.body.plan_nombre;
  const accion = req.body.accion;
  const organizador = req.body.organizador;

  if ((accion !== "Confirmado" && accion !== "Cancelado") || !planId || !planNombre || !organizador) {
    res.status(400).json({ error: "Datos del historial inválidos." });
    return;
  }

  const sql = "INSERT INTO historial (plan_id, plan_nombre, accion, fecha, organizador) VALUES (?, ?, ?, datetime('now', 'localtime'), ?)";

  try {
    const resultado = db.prepare(sql).run(planId, planNombre, accion, organizador);
    res.status(201).json({ id: resultado.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: "No se pudo guardar el evento." });
  }
});

module.exports = router;
