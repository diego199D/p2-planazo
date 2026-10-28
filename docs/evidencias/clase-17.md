# Clase 17 – Código ajeno y refactoring

## 1. Proyecto recibido
- **Grupo anterior:** diego199D
- **Repositorio:** https://github.com/diego199D/p2-planazo.git
---
## 2. Ejecucion
**Comando utilizado:**

```bash
npm install
npm start
```
La aplicación queda disponible en `http://localhost:3000/login.html`.


## 3. Recorrido: pantalla → accion → regla → datos

### Pantalla: `inicio.html` — Mis planes

**Accion:** El usuario ve la lista de sus planes y puede filtrarlos por nombre, estado o fecha.

**Regla aplicada:** No hay restriccion de acceso por plan; todos los planes se muestran sin filtrar por organizador en el `GET /api/planes`.

**Datos involucrados:**
- Tabla `planes` en SQLite (columnas: `id`, `nombre`, `descripcion`, `fecha`, `estado`, `alternativas`, `elegida`, `organizador`)
- Archivo: [`backend/planes.js`](../../backend/planes.js) — funcion `router.get("/")`
- Archivo: [`frontend/js/inicio.js`](../../frontend/js/inicio.js) — funcion `cargarPlanes()`

---

### Pantalla: `detalle-plan.html` → boton Confirmar / Cancelar

**Accion:** El organizador puede cambiar el estado del plan a "Decidido" o "Cancelado". Al hacerlo se guarda un evento en el historial.

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

**Accion:** El usuario ve todas las acciones relevantes (confirmaciones y cancelaciones) ordenadas de la mas reciente a la mas antigua.

**Regla aplicada:** El historial filtra por `organizador` (correo del usuario en sesion). Solo se aceptan acciones `"Confirmado"` o `"Cancelado"`.

```js
// backend/historial.js
if ((accion !== "Confirmado" && accion !== "Cancelado") || !planId || !planNombre || !organizador) {
  res.status(400).json({ error: "Datos del historial invalidos." });
}
```

**Datos involucrados:**
- Tabla `historial` (columnas: `id`, `plan_id`, `plan_nombre`, `accion`, `fecha`, `organizador`)
- Archivo: [`backend/historial.js`](../../backend/historial.js) — `router.get("/")`
- Archivo: [`frontend/js/historial.js`](../../frontend/js/historial.js)

---

## 4. Impacto: que debera cambiar para implementar la Tarea 5

(Completar con el enunciado real de la Tarea 5 cuando se publique. A continuacion se lista el impacto estimado según el estado actual del proyecto.)

| area | Cambio necesario |
|------|-----------------|
| **Base de datos** (`database/schema.sql`) | Probablemente agregar columnas o tablas nuevas para soportar la nueva funcionalidad (ej. participantes, votos, notificaciones). |
| **Backend** (`backend/planes.js`) | Nuevas rutas o validaciones adicionales en los endpoints existentes (`POST`, `PUT`). |
| **Reglas de negocio** (`frontend/js/reglas-plan.js`) | Agregar o modificar funciones como `puedeCancelarPlan` / `puedeConfirmarPlan` si cambian las condiciones. |
| **Frontend** (`frontend/js/`, `frontend/*.html`) | Nuevas pantallas o secciones que muestren la informacion requerida por la tarea. |
| **Historial** (`backend/historial.js`) | Si la tarea introduce nuevos tipos de accion, el backend actualmente valida que solo existan `"Confirmado"` y `"Cancelado"` — hay que actualizar esa lista. |
