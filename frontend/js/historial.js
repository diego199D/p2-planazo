const listaHistorial = document.getElementById("lista-historial");
const volver = document.getElementById("volver");
const usuario = JSON.parse(sessionStorage.getItem("usuario"));

function textoAccion(accion) {
  return accion === "Confirmado" ? "Plan confirmado" : "Plan cancelado";
}

function formatoFecha(fecha) {
  return new Date(fecha.replace(" ", "T")).toLocaleString();
}

async function cargarHistorial() {
  const params = new URLSearchParams({ organizador: usuario.correo });
  const respuesta = await fetch("/api/historial?" + params.toString());
  const registros = await respuesta.json();

  if (registros.length === 0) {
    listaHistorial.textContent = "Todavía no hay actividad en el historial.";
    return;
  }

  registros.forEach(function (registro) {
    const evento = document.createElement("article");
    const nombre = document.createElement("strong");
    const accion = document.createElement("p");
    const fecha = document.createElement("p");

    evento.className = "evento";
    nombre.textContent = registro.plan_nombre;
    accion.className = "accion";
    accion.textContent = textoAccion(registro.accion);
    fecha.className = "fecha";
    fecha.textContent = formatoFecha(registro.fecha);

    evento.appendChild(nombre);
    evento.appendChild(accion);
    evento.appendChild(fecha);
    listaHistorial.appendChild(evento);
  });
}

cargarHistorial();

volver.addEventListener("click", function () {
  window.location.href = "inicio.html";
});
