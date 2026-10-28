# Historial de planes

Se agregó una pantalla para consultar acciones importantes realizadas sobre los planes.

El historial registra:

- Plan confirmado.
- Plan cancelado.

Los eventos se guardan en SQLite y se muestran del mas reciente al mas antiguo.

## Mejora de interaccion

Antes no existia una forma directa de entrar al historial desde la pantalla Mis planes.

Se agrego el boton:

Ver historial

para acceder directamente. Se agrego un acceso directo al historial desde Mis planes para reducir pasos y facilitar la accion, relacionado con Fitts.


## Codigo relacionado

- frontend/inicio.html
- frontend/js/inicio.js
- frontend/historial.html
- frontend/js/historial.js
- backend/historial.js
