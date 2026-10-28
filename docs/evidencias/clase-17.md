# Clase 17 – Código ajeno y refactoring

## 1. Proyecto recibido

- **Grupo anterior:** diego199D
- **Repositorio:** https://github.com/diego199D/p2-planazo.git

---

## 2. Ejecución

**Comando utilizado:**

```bash
npm install
npm start
```

La aplicación queda disponible en `http://localhost:3000/login.html`.

**Captura funcionando:**

> _(Adjuntar captura de pantalla del navegador con la app corriendo)_

---

## 3. Recorrido: pantalla → acción → regla → datos

### Pantalla: `inicio.html` — Mis planes

**Acción:** El usuario ve la lista de sus planes y puede filtrarlos por nombre, estado o fecha.

**Regla aplicada:** No hay restricción de acceso por plan; todos los planes se muestran sin filtrar por organizador en el `GET /api/planes`.

**Datos involucrados:**
- Tabla `planes` en SQLite (columnas: `id`, `nombre`, `descripcion`, `fecha`, `estado`, `alternativas`, `elegida`, `organizador`)
- Archivo: [`backend/planes.js`](../../backend/planes.js) — función `router.get("/")`
- Archivo: [`frontend/js/inicio.js`](../../frontend/js/inicio.js) — función `cargarPlanes()`

---

### Pantalla: `detalle-plan.html` → botón Confirmar / Cancelar

**Acción:** El organizador puede cambiar el estado del plan a "Decidido" o "Cancelado". Al hacerlo se guarda un evento en el historial.

**Regla aplicada:** Solo puede cancelar el organizador del plan.

```js
// frontend/js/reglas-plan.js
function puedeCancelarPlan(plan, usuario) {
  if (plan.estado === "Cancelado") return false;
  if (plan.organizador !== usuario.correo) return false;
  return true;
}
```

**Datos involucrados:**
- `PUT /api/planes/:id` — actualiza `estado` en tabla `planes`
- `POST /api/historial` — inserta fila en tabla `historial` con `accion: "Cancelado"` o `"Confirmado"`
- Archivos: [`backend/planes.js`](../../backend/planes.js), [`backend/historial.js`](../../backend/historial.js), [`frontend/js/reglas-plan.js`](../../frontend/js/reglas-plan.js)

---

### Pantalla: `historial.html`

**Acción:** El usuario ve todas las acciones relevantes (confirmaciones y cancelaciones) ordenadas de la más reciente a la más antigua.

**Regla aplicada:** El historial filtra por `organizador` (correo del usuario en sesión). Solo se aceptan acciones `"Confirmado"` o `"Cancelado"`.

```js
// backend/historial.js
if ((accion !== "Confirmado" && accion !== "Cancelado") || !planId || !planNombre || !organizador) {
  res.status(400).json({ error: "Datos del historial inválidos." });
}
```

**Datos involucrados:**
- Tabla `historial` (columnas: `id`, `plan_id`, `plan_nombre`, `accion`, `fecha`, `organizador`)
- Archivo: [`backend/historial.js`](../../backend/historial.js) — `router.get("/")`
- Archivo: [`frontend/js/historial.js`](../../frontend/js/historial.js)

---

## 4. Impacto: qué deberá cambiar para implementar la Tarea 5

> _(Completar con el enunciado real de la Tarea 5 cuando se publique. A continuación se lista el impacto estimado según el estado actual del proyecto.)_

| Área | Cambio necesario |
|------|-----------------|
| **Base de datos** (`database/schema.sql`) | Probablemente agregar columnas o tablas nuevas para soportar la nueva funcionalidad (ej. participantes, votos, notificaciones). |
| **Backend** (`backend/planes.js`) | Nuevas rutas o validaciones adicionales en los endpoints existentes (`POST`, `PUT`). |
| **Reglas de negocio** (`frontend/js/reglas-plan.js`) | Agregar o modificar funciones como `puedeCancelarPlan` / `puedeConfirmarPlan` si cambian las condiciones. |
| **Frontend** (`frontend/js/`, `frontend/*.html`) | Nuevas pantallas o secciones que muestren la información requerida por la tarea. |
| **Historial** (`backend/historial.js`) | Si la tarea introduce nuevos tipos de acción, el backend actualmente valida que solo existan `"Confirmado"` y `"Cancelado"` — hay que actualizar esa lista. |
