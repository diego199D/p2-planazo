/* ================================================
   PLANAZO – inicio.js
   Full SPA logic for inicio.html:
   - Auth guard
   - Tab switching (base plans / my plans / voting / admin)
   - CRUD for personal plans (modal)
   - Voting (si/no, change vote, remove vote)
   - Admin: approve/reject pending, create base plan, view users
   ================================================ */

'use strict';

// ── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Authenticated fetch – attaches JWT Bearer token from sessionStorage.
 */
function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('token');
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
 * Returns parsed usuario object, or redirects to login if missing.
 */
function obtenerUsuario() {
  const data = sessionStorage.getItem('usuario');
  if (!data) { window.location.href = '/login.html'; return null; }
  try {
    return JSON.parse(data);
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

/**
 * Clears auth data and redirects to login.
 */
function cerrarSesion() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
  window.location.href = '/login.html';
}

// ── State ─────────────────────────────────────────────────────────────────────

let usuarioActual = null;

// ── Generic UI helpers ────────────────────────────────────────────────────────

function formatearFecha(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return str;
  }
}

function escaparHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str || '')));
  return div.innerHTML;
}

function mostrarMensajeGlobal(id, msg, tipo = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.className = tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error';
  setTimeout(() => { el.style.display = 'none'; }, 4500);
}

function setElemento(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function mostrarElemento(id, visible = true) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function ocultarLoading(loadingId) {
  const el = document.getElementById(loadingId);
  if (el) el.style.display = 'none';
}

// ── Tab management ────────────────────────────────────────────────────────────

const TAB_MAP = {
  'planes-base': 'tab-planes-base',
  'mis-planes':  'tab-mis-planes',
  'votaciones':  'tab-votaciones',
  'admin':       'tab-admin'
};

function activarTab(nombre) {
  // Toggle buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === nombre;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  // Toggle content panels
  Object.values(TAB_MAP).forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('active');
    panel.style.display = 'none';
  });

  const targetId = TAB_MAP[nombre];
  const target = document.getElementById(targetId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }

  // Load data for the tab if needed
  switch (nombre) {
    case 'planes-base': cargarPlanesBase(); break;
    case 'mis-planes':  cargarMisPlanes(); break;
    case 'votaciones':  cargarVotaciones(); break;
    case 'admin':       cargarAdminPanel(); break;
  }
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activarTab(btn.dataset.tab));
  });
}

// ── Admin tab injection ───────────────────────────────────────────────────────

function agregarTabAdmin() {
  const tabsBar = document.getElementById('tabs-bar');
  if (!tabsBar) return;
  const existing = tabsBar.querySelector('[data-tab="admin"]');
  if (existing) return; // already there

  const btn = document.createElement('button');
  btn.className = 'tab-btn';
  btn.dataset.tab = 'admin';
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', 'false');
  btn.textContent = '⚙ Panel Admin';
  tabsBar.appendChild(btn);
  btn.addEventListener('click', () => activarTab('admin'));

  // Also show the admin panel div
  const panel = document.getElementById('tab-admin');
  if (panel) panel.style.removeProperty('display');
}

// ── PLANES BASE ───────────────────────────────────────────────────────────────

let planesBaseCache = [];

async function cargarPlanesBase() {
  const loadingEl = document.getElementById('loading-planes-base');
  const listaEl   = document.getElementById('lista-planes-base');
  if (!listaEl) return;

  if (loadingEl) loadingEl.style.display = 'block';
  listaEl.innerHTML = '';

  try {
    const res = await authFetch('/api/planes/base');
    if (res.status === 401) { cerrarSesion(); return; }

    const planes = await res.json();
    planesBaseCache = Array.isArray(planes) ? planes : [];

    if (planesBaseCache.length === 0) {
      listaEl.innerHTML = '<p class="empty-msg">No hay planes base disponibles aún.</p>';
      return;
    }

    listaEl.innerHTML = planesBaseCache.map(p => renderPlanBaseCard(p)).join('');

  } catch (err) {
    listaEl.innerHTML = '<p class="empty-msg">Error al cargar los planes. Inténtalo de nuevo.</p>';
    console.error('cargarPlanesBase:', err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function renderPlanBaseCard(plan) {
  const fecha = formatearFecha(plan.fecha);
  const organizador = escaparHtml(plan.organizador || plan.creador || plan.autor || 'Administración');

  return `
    <div class="plan-card" data-id="${plan.id}">
      <div class="plan-card-title">${escaparHtml(plan.nombre)}</div>
      <div class="plan-card-desc">${escaparHtml(plan.descripcion || '')}</div>
      <div class="plan-card-meta">
        <span>📅 ${fecha}</span>
        <span>👤 ${organizador}</span>
      </div>
      <div class="plan-card-footer">
        <span class="badge badge-aprobado">Aprobado</span>
        <button class="btn btn-outline btn-sm" onclick="irAVotacion(${plan.id})">Ver votación</button>
      </div>
    </div>
  `;
}

function irAVotacion(planId) {
  activarTab('votaciones');
  // Scroll to that plan's card after a tick
  setTimeout(() => {
    const card = document.querySelector(`#lista-votaciones [data-id="${planId}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

// ── MIS PLANES ────────────────────────────────────────────────────────────────

async function cargarMisPlanes() {
  const loadingEl = document.getElementById('loading-mis-planes');
  const listaEl   = document.getElementById('lista-mis-planes');
  if (!listaEl) return;

  if (loadingEl) loadingEl.style.display = 'block';
  listaEl.innerHTML = '';

  try {
    const res = await authFetch('/api/planes/personales');
    if (res.status === 401) { cerrarSesion(); return; }

    const planes = await res.json();
    const lista = Array.isArray(planes) ? planes : [];

    if (lista.length === 0) {
      listaEl.innerHTML = '<p class="empty-msg">Aún no has creado ningún plan. ¡Crea uno!</p>';
      return;
    }

    listaEl.innerHTML = lista.map(p => renderMiPlanCard(p)).join('');

  } catch (err) {
    listaEl.innerHTML = '<p class="empty-msg">Error al cargar tus planes. Inténtalo de nuevo.</p>';
    console.error('cargarMisPlanes:', err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function renderMiPlanCard(plan) {
  const fecha = formatearFecha(plan.fecha);
  const estado = (plan.estado || 'pendiente').toLowerCase();

  const badgeClass = {
    pendiente: 'badge-pendiente',
    aprobado:  'badge-aprobado',
    rechazado: 'badge-rechazado'
  }[estado] || 'badge-pendiente';

  const estadoTexto = {
    pendiente: 'Pendiente',
    aprobado:  'Aprobado',
    rechazado: 'Rechazado'
  }[estado] || estado;

  return `
    <div class="plan-card" data-id="${plan.id}">
      <div class="plan-card-title">${escaparHtml(plan.nombre)}</div>
      <div class="plan-card-desc">${escaparHtml(plan.descripcion || '')}</div>
      <div class="plan-card-meta">
        <span>📅 ${fecha}</span>
      </div>
      <div class="plan-card-footer">
        <span class="badge ${badgeClass}">${estadoTexto}</span>
        <button class="btn btn-peligro btn-sm" onclick="eliminarPlan(${plan.id}, this)">Eliminar</button>
      </div>
    </div>
  `;
}

async function eliminarPlan(planId, btn) {
  if (!confirm('¿Seguro que quieres eliminar este plan?')) return;

  btn.disabled = true;
  btn.textContent = 'Eliminando…';

  try {
    const res = await authFetch(`/api/planes/${planId}`, { method: 'DELETE' });
    if (res.status === 401) { cerrarSesion(); return; }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || 'No se pudo eliminar el plan.');
    }

    // Remove card from DOM
    const card = document.querySelector(`#lista-mis-planes [data-id="${planId}"]`);
    if (card) {
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        card.remove();
        // Check if list is empty
        const lista = document.getElementById('lista-mis-planes');
        if (lista && lista.children.length === 0) {
          lista.innerHTML = '<p class="empty-msg">Aún no has creado ningún plan. ¡Crea uno!</p>';
        }
      }, 300);
    }

  } catch (err) {
    alert(err.message || 'Error al eliminar el plan.');
    btn.disabled = false;
    btn.textContent = 'Eliminar';
  }
}

// ── MODAL: CREAR PLAN ─────────────────────────────────────────────────────────

function abrirModal() {
  const modal = document.getElementById('modal-crear-plan');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('plan-nombre').focus();
  limpiarModal();
}

function cerrarModal() {
  const modal = document.getElementById('modal-crear-plan');
  if (modal) modal.style.display = 'none';
  limpiarModal();
}

function limpiarModal() {
  const form = document.getElementById('form-crear-plan');
  if (form) form.reset();
  mostrarElemento('modal-error', false);
  mostrarElemento('modal-exito', false);
  document.querySelectorAll('#form-crear-plan .campo-error')
    .forEach(el => (el.textContent = ''));
  const btn = document.getElementById('btn-crear-plan');
  if (btn) { btn.disabled = false; btn.textContent = 'Crear plan'; }
}

async function manejarCrearPlan(e) {
  e.preventDefault();

  const nombre      = document.getElementById('plan-nombre').value.trim();
  const descripcion = document.getElementById('plan-descripcion').value.trim();
  const fecha       = document.getElementById('plan-fecha').value;

  // Clear previous errors
  ['err-plan-nombre', 'err-plan-desc', 'err-plan-fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  mostrarElemento('modal-error', false);

  let valido = true;
  if (!nombre) {
    const el = document.getElementById('err-plan-nombre');
    if (el) el.textContent = 'El nombre es obligatorio.';
    valido = false;
  }
  if (!descripcion) {
    const el = document.getElementById('err-plan-desc');
    if (el) el.textContent = 'La descripción es obligatoria.';
    valido = false;
  }
  if (!fecha) {
    const el = document.getElementById('err-plan-fecha');
    if (el) el.textContent = 'La fecha es obligatoria.';
    valido = false;
  }
  if (!valido) return;

  const btn = document.getElementById('btn-crear-plan');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando…'; }

  try {
    const res = await authFetch('/api/planes', {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion, fecha })
    });
    if (res.status === 401) { cerrarSesion(); return; }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || 'No se pudo crear el plan.');

    // Show success and close
    const exitoEl = document.getElementById('modal-exito');
    if (exitoEl) {
      exitoEl.textContent = '¡Plan creado correctamente! Está pendiente de aprobación.';
      exitoEl.style.display = 'block';
    }

    setTimeout(() => {
      cerrarModal();
      cargarMisPlanes();
    }, 1500);

  } catch (err) {
    const errorEl = document.getElementById('modal-error');
    if (errorEl) {
      errorEl.textContent = err.message || 'Error al crear el plan.';
      errorEl.style.display = 'block';
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Crear plan'; }
  }
}

function initModal() {
  const btnAbrir    = document.getElementById('btn-abrir-modal');
  const btnCerrar   = document.getElementById('btn-cerrar-modal');
  const btnCancelar = document.getElementById('btn-cancelar-modal');
  const overlay     = document.getElementById('modal-crear-plan');
  const form        = document.getElementById('form-crear-plan');

  if (btnAbrir)    btnAbrir.addEventListener('click', abrirModal);
  if (btnCerrar)   btnCerrar.addEventListener('click', cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);
  if (form)        form.addEventListener('submit', manejarCrearPlan);

  // Close on backdrop click
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
      cerrarModal();
    }
  });
}

// ── VOTACIONES ────────────────────────────────────────────────────────────────

// Cache of vote data keyed by planId
const votosCache = {};

async function cargarVotaciones() {
  const loadingEl = document.getElementById('loading-votaciones');
  const listaEl   = document.getElementById('lista-votaciones');
  if (!listaEl) return;

  if (loadingEl) loadingEl.style.display = 'block';
  listaEl.innerHTML = '';

  try {
    // Re-use planes base or fetch them
    let planes = planesBaseCache;
    if (!planes || planes.length === 0) {
      const res = await authFetch('/api/planes/base');
      if (res.status === 401) { cerrarSesion(); return; }
      planes = await res.json();
      planesBaseCache = Array.isArray(planes) ? planes : [];
    }

    if (planesBaseCache.length === 0) {
      listaEl.innerHTML = '<p class="empty-msg">No hay planes disponibles para votar.</p>';
      return;
    }

    // Render skeleton cards first, then load each vote count
    listaEl.innerHTML = planesBaseCache
      .map(p => renderVotacionCard(p, null))
      .join('');

    // Fetch votes for each plan in parallel
    await Promise.all(planesBaseCache.map(p => cargarVotosPlan(p.id)));

  } catch (err) {
    listaEl.innerHTML = '<p class="empty-msg">Error al cargar las votaciones.</p>';
    console.error('cargarVotaciones:', err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function renderVotacionCard(plan, votos) {
  const sinVotos = !votos;
  const mivoto  = votos ? votos.mi_voto : null;
  const votosSi = votos ? (votos.votos_si || 0) : '–';
  const votosNo = votos ? (votos.votos_no || 0) : '–';
  const total   = votos ? (votos.total    || 0) : '–';

  const btnSiClass = mivoto === 'si' ? 'voto-btn active-si' : 'voto-btn';
  const btnNoClass = mivoto === 'no' ? 'voto-btn active-no' : 'voto-btn';

  const miVotoLabel = mivoto
    ? `<span class="mi-voto-label">Tu voto: ${mivoto === 'si' ? '👍 Sí' : '👎 No'}</span>
       <button class="btn-quitar-voto" onclick="quitarVoto(${plan.id})">Quitar voto</button>`
    : '';

  return `
    <div class="plan-card" data-id="${plan.id}">
      <div class="plan-card-title">${escaparHtml(plan.nombre)}</div>
      <div class="plan-card-desc">${escaparHtml(plan.descripcion || '')}</div>
      <div class="votos-container" id="votos-${plan.id}">
        ${sinVotos
          ? '<div class="loading-msg" style="padding:.5rem 0;">Cargando votos…</div>'
          : `
          <div class="votos-btns">
            <button class="${btnSiClass}" onclick="emitirVoto(${plan.id}, 'si')">👍 Sí</button>
            <button class="${btnNoClass}" onclick="emitirVoto(${plan.id}, 'no')">👎 No</button>
          </div>
          <div class="votos-counter">
            <span>${votosSi} votos Sí</span>
            <span>${votosNo} votos No</span>
            <span>${total} total</span>
          </div>
          <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
            ${miVotoLabel}
          </div>
          `
        }
      </div>
    </div>
  `;
}

async function cargarVotosPlan(planId) {
  try {
    const res = await authFetch(`/api/votos/${planId}`);
    if (res.status === 401) { cerrarSesion(); return; }
    const data = await res.json();
    votosCache[planId] = data;
    actualizarUIVotos(planId, data);
  } catch (err) {
    console.warn(`Error cargando votos del plan ${planId}:`, err);
    const cont = document.getElementById(`votos-${planId}`);
    if (cont) cont.innerHTML = '<span class="campo-error">Error al cargar los votos.</span>';
  }
}

function actualizarUIVotos(planId, votos) {
  const cont = document.getElementById(`votos-${planId}`);
  if (!cont) return;

  const mivoto  = votos ? votos.mi_voto : null;
  const votosSi = votos ? (votos.votos_si || 0) : 0;
  const votosNo = votos ? (votos.votos_no || 0) : 0;
  const total   = votos ? (votos.total    || 0) : 0;

  const btnSiClass = mivoto === 'si' ? 'voto-btn active-si' : 'voto-btn';
  const btnNoClass = mivoto === 'no' ? 'voto-btn active-no' : 'voto-btn';

  const miVotoLabel = mivoto
    ? `<span class="mi-voto-label">Tu voto: ${mivoto === 'si' ? '👍 Sí' : '👎 No'}</span>
       <button class="btn-quitar-voto" onclick="quitarVoto(${planId})">Quitar voto</button>`
    : '';

  cont.innerHTML = `
    <div class="votos-btns">
      <button class="${btnSiClass}" onclick="emitirVoto(${planId}, 'si')">👍 Sí</button>
      <button class="${btnNoClass}" onclick="emitirVoto(${planId}, 'no')">👎 No</button>
    </div>
    <div class="votos-counter">
      <span>${votosSi} votos Sí</span>
      <span>${votosNo} votos No</span>
      <span>${total} total</span>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
      ${miVotoLabel}
    </div>
  `;
}

async function emitirVoto(planId, voto) {
  // Disable buttons momentarily
  const cont = document.getElementById(`votos-${planId}`);
  if (cont) cont.querySelectorAll('.voto-btn').forEach(b => (b.disabled = true));

  try {
    const res = await authFetch(`/api/votos/${planId}`, {
      method: 'POST',
      body: JSON.stringify({ voto })
    });
    if (res.status === 401) { cerrarSesion(); return; }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || 'No se pudo registrar el voto.');
    }

    // Refresh vote data for this plan
    await cargarVotosPlan(planId);

  } catch (err) {
    alert(err.message || 'Error al votar.');
    if (cont) cont.querySelectorAll('.voto-btn').forEach(b => (b.disabled = false));
  }
}

async function quitarVoto(planId) {
  try {
    const res = await authFetch(`/api/votos/${planId}`, { method: 'DELETE' });
    if (res.status === 401) { cerrarSesion(); return; }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || 'No se pudo quitar el voto.');
    }

    await cargarVotosPlan(planId);

  } catch (err) {
    alert(err.message || 'Error al quitar el voto.');
  }
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────────────

async function cargarAdminPanel() {
  await Promise.all([
    cargarPendientes(),
    cargarUsuariosAdmin()
  ]);
}

// --- Pendientes ---

async function cargarPendientes() {
  const loadingEl = document.getElementById('loading-pendientes');
  const listaEl   = document.getElementById('lista-pendientes');
  if (!listaEl) return;

  if (loadingEl) loadingEl.style.display = 'block';
  listaEl.innerHTML = '';

  try {
    const res = await authFetch('/api/admin/pendientes');
    if (res.status === 401) { cerrarSesion(); return; }
    if (res.status === 403) {
      listaEl.innerHTML = '<p class="empty-msg">No tienes permisos de administrador.</p>';
      return;
    }

    const planes = await res.json();
    const lista = Array.isArray(planes) ? planes : [];

    if (lista.length === 0) {
      listaEl.innerHTML = '<p class="empty-msg">No hay planes pendientes de aprobación. 🎉</p>';
      return;
    }

    listaEl.innerHTML = lista.map(p => renderPendienteCard(p)).join('');

  } catch (err) {
    listaEl.innerHTML = '<p class="empty-msg">Error al cargar los pendientes.</p>';
    console.error('cargarPendientes:', err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function renderPendienteCard(plan) {
  const fecha = formatearFecha(plan.fecha);
  const autor  = escaparHtml(plan.autor || plan.creador || plan.usuario || '—');

  return `
    <div class="pendiente-card" id="pendiente-${plan.id}">
      <div class="pendiente-card-header">
        <div>
          <div class="pendiente-card-title">${escaparHtml(plan.nombre)}</div>
          <div class="pendiente-card-meta">📅 ${fecha} · 👤 ${autor}</div>
        </div>
        <span class="badge badge-pendiente">Pendiente</span>
      </div>
      <div class="plan-card-desc" style="margin-top:.25rem;">${escaparHtml(plan.descripcion || '')}</div>
      <div class="pendiente-card-actions">
        <button class="btn btn-exito btn-sm" onclick="aprobarPlan(${plan.id}, this)">✔ Aprobar</button>
        <button class="btn btn-peligro btn-sm" onclick="rechazarPlan(${plan.id}, this)">✘ Rechazar</button>
      </div>
    </div>
  `;
}

async function aprobarPlan(planId, btn) {
  btn.disabled = true;
  btn.textContent = 'Aprobando…';

  try {
    const res = await authFetch(`/api/admin/planes/${planId}/aprobar`, { method: 'PUT' });
    if (res.status === 401) { cerrarSesion(); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || 'No se pudo aprobar el plan.');
    }

    const card = document.getElementById(`pendiente-${planId}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        card.remove();
        checkPendientesVacios();
      }, 300);
    }

    // Invalidate planes base cache so next visit reloads
    planesBaseCache = [];

  } catch (err) {
    alert(err.message || 'Error al aprobar el plan.');
    btn.disabled = false;
    btn.textContent = '✔ Aprobar';
  }
}

async function rechazarPlan(planId, btn) {
  if (!confirm('¿Seguro que quieres rechazar este plan?')) return;

  btn.disabled = true;
  btn.textContent = 'Rechazando…';

  try {
    const res = await authFetch(`/api/admin/planes/${planId}/rechazar`, { method: 'PUT' });
    if (res.status === 401) { cerrarSesion(); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || 'No se pudo rechazar el plan.');
    }

    const card = document.getElementById(`pendiente-${planId}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        card.remove();
        checkPendientesVacios();
      }, 300);
    }

  } catch (err) {
    alert(err.message || 'Error al rechazar el plan.');
    btn.disabled = false;
    btn.textContent = '✘ Rechazar';
  }
}

function checkPendientesVacios() {
  const lista = document.getElementById('lista-pendientes');
  if (lista && lista.children.length === 0) {
    lista.innerHTML = '<p class="empty-msg">No hay planes pendientes de aprobación. 🎉</p>';
  }
}

// --- Crear Plan Base (admin) ---

async function manejarCrearPlanAdmin(e) {
  e.preventDefault();

  const nombre      = document.getElementById('admin-nombre').value.trim();
  const descripcion = document.getElementById('admin-descripcion').value.trim();
  const fecha       = document.getElementById('admin-fecha').value;

  mostrarElemento('admin-plan-error', false);
  mostrarElemento('admin-plan-exito', false);

  if (!nombre || !descripcion || !fecha) {
    const el = document.getElementById('admin-plan-error');
    if (el) { el.textContent = 'Completa todos los campos.'; el.style.display = 'block'; }
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando…'; }

  try {
    const res = await authFetch('/api/planes', {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion, fecha, tipo: 'base' })
    });
    if (res.status === 401) { cerrarSesion(); return; }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.mensaje || 'No se pudo crear el plan.');

    const el = document.getElementById('admin-plan-exito');
    if (el) { el.textContent = '¡Plan base creado exitosamente!'; el.style.display = 'block'; }

    e.target.reset();
    planesBaseCache = []; // invalidate cache

  } catch (err) {
    const el = document.getElementById('admin-plan-error');
    if (el) { el.textContent = err.message || 'Error al crear el plan.'; el.style.display = 'block'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Crear plan base'; }
  }
}

// --- Usuarios ---

async function cargarUsuariosAdmin() {
  const loadingEl = document.getElementById('loading-usuarios');
  const tabla     = document.getElementById('tabla-usuarios');
  const tbody     = document.getElementById('tbody-usuarios');
  if (!tbody) return;

  if (loadingEl) loadingEl.style.display = 'block';
  if (tabla) tabla.style.display = 'none';

  try {
    const res = await authFetch('/api/admin/usuarios');
    if (res.status === 401) { cerrarSesion(); return; }
    if (res.status === 403) {
      if (loadingEl) loadingEl.textContent = 'No tienes permisos.';
      return;
    }

    const usuarios = await res.json();
    const lista = Array.isArray(usuarios) ? usuarios : [];

    if (lista.length === 0) {
      if (loadingEl) loadingEl.textContent = 'No hay usuarios registrados.';
      return;
    }

    tbody.innerHTML = lista.map(u => `
      <tr>
        <td>${escaparHtml(u.nombre)}</td>
        <td>${escaparHtml(u.correo)}</td>
        <td>
          <span class="badge ${u.rol === 'admin' ? 'badge-aprobado' : 'badge-pendiente'}">
            ${escaparHtml(u.rol || 'usuario')}
          </span>
        </td>
      </tr>
    `).join('');

    if (tabla) tabla.style.display = 'table';

  } catch (err) {
    if (loadingEl) loadingEl.textContent = 'Error al cargar usuarios.';
    console.error('cargarUsuariosAdmin:', err);
  } finally {
    if (loadingEl && tabla && tabla.style.display !== 'none') {
      loadingEl.style.display = 'none';
    } else if (loadingEl && tabla && tabla.style.display === 'none') {
      // Keep error message visible
    }
    if (loadingEl && tabla && tabla.style.display === 'table') {
      loadingEl.style.display = 'none';
    }
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────

async function init() {
  // Auth guard
  usuarioActual = obtenerUsuario();
  if (!usuarioActual) return; // redirect already triggered

  // Greet user in navbar
  const navNombre = document.getElementById('navbar-nombre');
  if (navNombre) navNombre.textContent = `Hola, ${usuarioActual.nombre || usuarioActual.correo}`;

  // Show admin tab if admin
  if (usuarioActual.rol === 'admin') {
    agregarTabAdmin();
  }

  // Init tab events
  initTabs();

  // Init modal events
  initModal();

  // Init admin plan form
  const formAdminPlan = document.getElementById('form-admin-plan');
  if (formAdminPlan) {
    formAdminPlan.addEventListener('submit', manejarCrearPlanAdmin);
  }

  // Load first tab
  activarTab('planes-base');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
