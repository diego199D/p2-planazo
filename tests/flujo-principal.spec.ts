import { test, expect } from '@playwright/test';

// Datos de prueba
const USUARIO = { nombre: 'Tester', correo: 'test@planazo.com' };
const PLAN = {
  nombre: 'Plan de prueba automatizada',
  descripcion: 'Descripción generada por Playwright',
  fecha: '2027-06-15',
};

test.describe('Flujo principal: crear plan → aparecer en Mis Planes', () => {
  test('debe crear un plan y verlo en la lista de inicio', async ({ page }) => {
    // ── 1. SIMULAR LOGIN (inyectar usuario en localStorage) ───────────────────
    console.log('▶ Paso 1: Navegando a login...');
    await page.goto('/login.html');
    await expect(page).toHaveTitle(/Planazo/i);

    console.log('▶ Paso 2: Completando formulario de login...');
    await page.fill('#correo', USUARIO.correo);
    await page.fill('#password', '1234');

    // Inyectar el usuario en localStorage ANTES de que el redirect ocurra
    // ya que el login.js no persiste el usuario, lo hace el registro.
    // Lo seteamos manualmente para simular una sesión activa.
    await page.evaluate((usuario) => {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }, USUARIO);

    await page.click('button[type="submit"]');

    console.log('▶ Paso 3: Esperando página de inicio...');
    await page.waitForURL('**/inicio.html');
    await expect(page.locator('h2')).toHaveText('Mis planes');
    console.log('✔ Login OK — estamos en Mis Planes');

    // ── 2. IR A CREAR PLAN ────────────────────────────────────────────────────
    console.log('▶ Paso 4: Haciendo click en "Crear nuevo plan"...');
    await page.click('#crear-plan');
    await page.waitForURL('**/crear-plan.html');
    await expect(page.locator('h2')).toHaveText('Crear nuevo plan');
    console.log('✔ Estamos en la página Crear nuevo plan');

    // ── 3. COMPLETAR Y ENVIAR FORMULARIO ──────────────────────────────────────
    console.log('▶ Paso 5: Rellenando formulario del plan...');
    await page.fill('#nombre', PLAN.nombre);
    await page.fill('#descripcion', PLAN.descripcion);
    await page.fill('#fecha', PLAN.fecha);

    console.log('▶ Paso 6: Enviando formulario y esperando redirección...');
    await page.click('button[type="submit"]');

    // Tras crear el plan redirige a detalle-plan.html
    await page.waitForURL('**/detalle-plan.html');
    console.log('✔ Plan creado — redirigido correctamente a detalle del plan');

    // ── 4. VOLVER A INICIO Y VERIFICAR QUE EL PLAN APARECE ───────────────────
    console.log('▶ Paso 7: Volviendo a Mis Planes...');
    await page.goto('/inicio.html');
    await page.waitForURL('**/inicio.html');

    console.log('▶ Paso 8: Verificando que el plan aparece en la lista...');
    const listaPlanes = page.locator('#lista-planes');
    await expect(listaPlanes).toBeVisible();

    // Esperar a que la lista cargue (fetch asíncrono)
    // Usamos .first() porque puede haber planes anteriores con el mismo nombre de runs previos
    const tarjetaPlan = listaPlanes.locator('button.plan', { hasText: PLAN.nombre }).first();
    await expect(tarjetaPlan).toBeVisible({ timeout: 10000 });
    console.log(`✔ El plan "${PLAN.nombre}" aparece correctamente en Mis Planes`);

    // Verificar que el estado sea "Pendiente" (En decisión)
    const estadoPlan = tarjetaPlan.locator('.estado');
    await expect(estadoPlan).toHaveText('Estado: Pendiente');
    console.log('✔ El estado del plan es "Pendiente" ✓');
    console.log('✅ FLUJO COMPLETO: crear plan → aparece en Mis Planes — PASADO');
  });
});
