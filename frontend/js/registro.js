/* ================================================
   PLANAZO – registro.js
   Handles registration form: validation (including
   password match), POST to /api/auth/registro,
   JWT storage, and redirect to inicio.html.
   ================================================ */

'use strict';

// ── Toggle password visibility ───────────────────────────────────────────────

function togglePass(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.setAttribute('aria-label', 'Ocultar contraseña');
  } else {
    input.type = 'password';
    btn.textContent = '👁';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
  }
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function mostrarError(mensaje) {
  const el = document.getElementById('mensaje-error');
  if (!el) return;
  el.textContent = mensaje;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarError() {
  const el = document.getElementById('mensaje-error');
  if (el) el.style.display = 'none';
}

function mostrarExito(mensaje) {
  const el = document.getElementById('mensaje-exito');
  if (!el) return;
  el.textContent = mensaje;
  el.style.display = 'block';
}

function setCampoError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function limpiarCampoErrors() {
  document.querySelectorAll('.campo-error').forEach(el => (el.textContent = ''));
}

function setLoading(isLoading) {
  const btn = document.getElementById('btn-submit');
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Registrando…';
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Registrarse';
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validarFormulario(nombre, correo, password, confirmar) {
  let valido = true;
  limpiarCampoErrors();
  ocultarError();

  if (!nombre || nombre.trim().length < 2) {
    setCampoError('error-nombre', 'El nombre debe tener al menos 2 caracteres.');
    valido = false;
  }

  if (!correo || !correo.includes('@') || !correo.includes('.')) {
    setCampoError('error-correo', 'Introduce un correo electrónico válido.');
    valido = false;
  }

  if (!password || password.length < 6) {
    setCampoError('error-password', 'La contraseña debe tener al menos 6 caracteres.');
    valido = false;
  }

  if (password !== confirmar) {
    setCampoError('error-confirmar', 'Las contraseñas no coinciden.');
    valido = false;
  }

  return valido;
}

// ── Registration logic ───────────────────────────────────────────────────────

async function manejarRegistro(e) {
  e.preventDefault();

  const nombre    = document.getElementById('nombre').value.trim();
  const correo    = document.getElementById('correo').value.trim();
  const password  = document.getElementById('password').value;
  const confirmar = document.getElementById('confirmar_password').value;

  if (!validarFormulario(nombre, correo, password, confirmar)) return;

  setLoading(true);

  try {
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Respuesta inesperada del servidor.');
    }

    if (!res.ok) {
      throw new Error(data.mensaje || data.message || 'No se pudo crear la cuenta.');
    }

    if (!data.token || !data.usuario) {
      throw new Error('La respuesta del servidor no es válida.');
    }

    // Persist credentials
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    mostrarExito('¡Cuenta creada! Redirigiendo…');

    setTimeout(() => {
      window.location.href = '/inicio.html';
    }, 600);

  } catch (err) {
    mostrarError(err.message || 'Error al registrarse. Inténtalo de nuevo.');
  } finally {
    setLoading(false);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  // If already logged in, skip registration
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/inicio.html';
    return;
  }

  const form = document.getElementById('form-registro');
  if (form) {
    form.addEventListener('submit', manejarRegistro);
  }

  // Real-time password match feedback
  const passInput    = document.getElementById('password');
  const confirmInput = document.getElementById('confirmar_password');

  function checkMatch() {
    const el = document.getElementById('error-confirmar');
    if (!el || !confirmInput.value) return;
    el.textContent = passInput.value !== confirmInput.value
      ? 'Las contraseñas no coinciden.'
      : '';
  }

  if (passInput)    passInput.addEventListener('input', checkMatch);
  if (confirmInput) confirmInput.addEventListener('input', checkMatch);
})();
