const idPlan = sessionStorage.getItem("planActual");
const contenidoPlan = document.getElementById("contenido-plan");
const nombrePlan = document.getElementById("nombre-plan");
const descripcionPlan = document.getElementById("descripcion-plan");
const fechaPlan = document.getElementById("fecha-plan");
const estadoPlan = document.getElementById("estado-plan");
const listaAlternativas = document.getElementById("lista-alternativas");
const formulario = document.getElementById("formulario-alternativa");
const alternativa = document.getElementById("alternativa");
const mensaje = document.getElementById("mensaje");
const editar = document.getElementById("editar");
const confirmar = document.getElementById("confirmar");
const eliminar = document.getElementById("eliminar");
const cancelar = document.getElementById("cancelar");
const volver = document.getElementById("volver");
const usuario = JSON.parse(sessionStorage.getItem("usuario"));
let plan;

function nombreEstado(estado) {
  if (estado === "En decisión") {
    return "Pendiente";
  }

  if (estado === "Decidido") {
    return "Confirmado";
  }

  return "Cancelado";
}

function mostrarAlternativas() {
  listaAlternativas.innerHTML = "";

  if (plan.alternativas.length === 0) {
    listaAlternativas.textContent = "No hay alternativas todavía.";
    return;
  }

  plan.alternativas.forEach(function (opcion) {
    const bloqueAlternativa = document.createElement("p");
    const botonElegir = document.createElement("button");

    bloqueAlternativa.className = "alternativa";
    bloqueAlternativa.textContent = opcion;
    botonElegir.textContent = "Elegir";
    botonElegir.addEventListener("click", async function () {
      if (!puedeConfirmarPlan(plan)) {
        mensaje.textContent = "No puedes confirmar un plan cancelado.";
        return;
      }

      plan.elegida = opcion;
      await guardarPlan();
      mostrarPlan();
    });
    bloqueAlternativa.appendChild(botonElegir);
    listaAlternativas.appendChild(bloqueAlternativa);
  });
}

function mostrarPlan() {
  nombrePlan.textContent = "Plan: " + plan.nombre;
  descripcionPlan.textContent = plan.descripcion ? "Descripción: " + plan.descripcion : "";
  fechaPlan.textContent = plan.fecha ? "Fecha: " + plan.fecha : "";
  estadoPlan.textContent = "Estado: " + nombreEstado(plan.estado) + (plan.elegida ? " - Opción elegida: " + plan.elegida : "");
  confirmar.hidden = plan.estado !== "En decisión";
  cancelar.hidden = false;
  mostrarAlternativas();
}

async function guardarPlan() {
  const respuesta = await fetch("/api/planes/" + idPlan, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan)
  });

  return respuesta.ok;
}

async function guardarEvento(accion) {
  await fetch("/api/historial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: plan.id,
      plan_nombre: plan.nombre,
      accion: accion,
      organizador: plan.organizador
    })
  });
}

async function cargarPlan() {
  const respuesta = await fetch("/api/planes/" + idPlan);

  if (!respuesta.ok) {
    contenidoPlan.textContent = "No se encontró el plan.";
    return;
  }

  plan = await respuesta.json();
  mostrarPlan();

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (alternativa.value.trim() === "") {
      mensaje.textContent = "Ingresa una alternativa.";
      return;
    }

    agregarAlternativa();
  });

  editar.addEventListener("click", function () {
    window.location.href = "editar-plan.html";
  });

  eliminar.addEventListener("click", function () {
    eliminarPlan();
  });

  cancelar.addEventListener("click", function () {
    cancelarPlan();
  });

  confirmar.addEventListener("click", function () {
    confirmarPlan();
  });
}

async function agregarAlternativa() {
  plan.alternativas.push(alternativa.value.trim());
  await guardarPlan();
    alternativa.value = "";
    mensaje.textContent = "";
    mostrarAlternativas();
}

async function confirmarPlan() {
  if (!puedeConfirmarPlan(plan)) {
    mensaje.textContent = "No puedes confirmar un plan cancelado.";
    return;
  }

  const estadoAnterior = plan.estado;
  plan.estado = "Decidido";

  if (!await guardarPlan()) {
    plan.estado = estadoAnterior;
    mensaje.textContent = "No se pudo confirmar el plan.";
    return;
  }

  await guardarEvento("Confirmado");
  mostrarPlan();
  mensaje.textContent = "";
}

async function eliminarPlan() {
  if (!puedeEliminarPlan(plan)) {
    mensaje.textContent = "No puedes eliminar un plan decidido. Primero debes cancelarlo.";
    return;
  }

  if (!confirm("¿Seguro que quieres eliminar este plan?")) {
    return;
  }

  const respuesta = await fetch("/api/planes/" + idPlan, { method: "DELETE" });

  if (!respuesta.ok) {
    const error = await respuesta.json();
    mensaje.textContent = error.error;
    return;
  }

  window.location.href = "inicio.html";
}

async function cancelarPlan() {
  if (!puedeCancelarPlan(plan, usuario)) {
    if (plan.estado === "Cancelado") {
      mensaje.textContent = "Este plan ya está cancelado.";
      return;
    }

    if (plan.organizador !== usuario.correo) {
      mensaje.textContent = "Solo el organizador puede cancelar este plan.";
    }

    return;
  }

  if (!confirm("¿Seguro que quieres cancelar este plan?")) {
    return;
  }

  const estadoAnterior = plan.estado;
  plan.estado = "Cancelado";

  if (!await guardarPlan()) {
    plan.estado = estadoAnterior;
    mensaje.textContent = "No se pudo cancelar el plan.";
    return;
  }

  await guardarEvento("Cancelado");
  mostrarPlan();
  mensaje.textContent = "";
}

cargarPlan();

volver.addEventListener("click", function () {
  window.location.href = "inicio.html";
});
