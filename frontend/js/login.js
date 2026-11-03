/* ================================================
   PLANAZO – login.js
   Handles login form submission, validation, and
   JWT storage before redirecting to inicio.html
   ================================================ */

'use strict';

// ── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Authenticated fetch wrapper – attaches Bearer token to every request.
 */
function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

/**
 * Toggle password field visibility.
 * Called from the 👁 button in the HTML.
 */
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
    btn.textContent = 'Iniciando sesión…';
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Iniciar sesión';
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validarFormulario(correo, password) {
  let valido = true;
  limpiarCampoErrors();
  ocultarError();

  if (!correo || !correo.includes('@')) {
    setCampoError('error-correo', 'Introduce un correo válido.');
    valido = false;
  }

  if (!password || password.length < 1) {
    setCampoError('error-password', 'La contraseña no puede estar vacía.');
    valido = false;
  }

  return valido;
}

// ── Login logic ──────────────────────────────────────────────────────────────

async function manejarLogin(e) {
  e.preventDefault();

  const correo   = document.getElementById('correo').value.trim();
  const password = document.getElementById('password').value;

  if (!validarFormulario(correo, password)) return;

  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Respuesta inesperada del servidor.');
    }

    if (!res.ok) {
      throw new Error(data.mensaje || data.message || 'Correo o contraseña incorrectos.');
    }

    if (!data.token || !data.usuario) {
      throw new Error('La respuesta del servidor no es válida.');
    }

    // Persist credentials
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    mostrarExito('¡Bienvenido! Redirigiendo…');

    setTimeout(() => {
      window.location.href = '/inicio.html';
    }, 500);

  } catch (err) {
    mostrarError(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
  } finally {
    setLoading(false);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  // If already logged in, skip login page
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/inicio.html';
    return;
  }

  const form = document.getElementById('form-login');
  if (form) {
    form.addEventListener('submit', manejarLogin);
  }

  // Allow Enter key on password field
  const passInput = document.getElementById('password');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') form && form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
  }
})();
