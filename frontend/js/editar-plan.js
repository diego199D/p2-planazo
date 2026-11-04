const idPlan = sessionStorage.getItem("planActual");
const formulario = document.getElementById("formulario-editar");
const nombre = document.getElementById("nombre");
const descripcion = document.getElementById("descripcion");
const fecha = document.getElementById("fecha");
const mensaje = document.getElementById("mensaje");
let plan;

async function cargarPlan() {
  const respuesta = await fetch("/api/planes/" + idPlan);

  if (!respuesta.ok) {
    mensaje.textContent = "No se encontró el plan.";
    formulario.style.display = "none";
    return;
  }

  plan = await respuesta.json();
  nombre.value = plan.nombre;
  descripcion.value = plan.descripcion;
  fecha.value = plan.fecha;
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  if (nombre.value.trim() === "") {
    mensaje.textContent = "Ingresa un nombre para el plan.";
    return;
  }

  plan.nombre = nombre.value.trim();
  plan.descripcion = descripcion.value.trim();
  plan.fecha = fecha.value;

  await fetch("/api/planes/" + idPlan, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan)
  });

  window.location.href = "detalle-plan.html";
});

cargarPlan();
