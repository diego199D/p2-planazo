# Clase 20 – Mejora de usabilidad: navegación y nombres en Planazo

## 1. Integrante

Diego Anibal Toledo Yapura

## 2. Problema identificado

**Tarea difícil de encontrar:** encontrar un plan aprobado y votar a favor o en contra.

En la pantalla principal (`inicio.html`) las pestañas eran **Planes Base · Mis Planes · Votaciones**. Esto causaba tres problemas:

- **Nombre confuso:** "Planes Base" es un término interno de la base de datos (`tipo = 'base'`). Un usuario nuevo no sabe qué es un "plan base", si puede usarlo ni en qué se diferencia de "Mis Planes".
- **Acción separada del contenido:** los mismos planes aparecían en dos pestañas. En "Planes Base" no se podía votar. El único botón decía "Ver votación", que no indica que ahí se vota.
- **Falta de buscador:** para votar un plan concreto había que recorrer todas las tarjetas. Eso empeora a medida que hay más planes.
- **Información sin etiquetar:** las tarjetas mostraban solo íconos (📅, 👤) sin texto. Además, el organizador siempre aparecía como "Administración" porque el frontend leía un campo que el backend no envía.

## 3. Propuesta

```
Barra de pestañas
├── Explorar planes          (antes "Planes Base")
│     Subtítulo: "Planes aprobados abiertos a toda la comunidad. Elige uno y vota si te apuntas."
│     Recuadro de ayuda "ℹ️ ¿Qué son estos planes?"
│       • Son planes ya aprobados por el administrador.
│       • Cualquiera puede votar 👍 Sí o 👎 No.
│       • ¿Quieres proponer el tuyo? Créalo en [Mis planes]; aparecerá aquí cuando se apruebe.
│     Tarjeta de plan
│       📅 Fecha del plan: …
│       👤 Propuesto por: <nombre real del organizador>
│       [Aprobado]                [Votar este plan →]
├── Mis planes               (antes "Mis Planes")
├── Votar planes             (antes "Votaciones")
│     Subtítulo: "Elige 👍 Sí o 👎 No en cada plan. Puedes cambiar tu voto."
│     Campo "Buscar plan" – placeholder "Escribe el nombre del plan…"
│       → filtra por nombre o descripción mientras se escribe
│       → sin coincidencias: "Ningún plan coincide con «…»."
└── ⚙ Panel Admin            (sin cambios, solo administradores)
```

**Acceso a la función de votar:**
1. Directo, con la pestaña **Votar planes**.
2. Desde cada tarjeta de **Explorar planes**, con el botón **Votar este plan →**. Lleva a la tarjeta de ese plan y la resalta.

## 4. Motivo de la decisión

- **Lenguaje del usuario, no del sistema:** las pestañas describen lo que la persona hace (*Explorar*, *Votar*, *Mis planes*) en vez de usar términos técnicos como "base".
- **Un nombre por acción:** "Ver votación" pasó a ser "Votar este plan →". El botón dice exactamente lo que pasa al pulsarlo, y la flecha indica que lleva a otra sección.
- **Ayuda en el lugar donde surge la duda:** el recuadro de Explorar planes responde qué son esos planes, qué se puede hacer con ellos y cómo agregar uno propio. Además conecta con *Mis planes*, así la relación entre las pestañas queda clara.
- **Reconocer antes que recordar:** las tarjetas etiquetan cada dato ("Fecha del plan", "Propuesto por") en vez de depender solo de íconos.
- **Buscador junto a lo que filtra:** el campo está justo encima de la lista de votación, con etiqueta visible. Si no hay resultados lo dice, para que la lista vacía no parezca un error.
- **Retroalimentación:** al llegar desde "Votar este plan" se resalta la tarjeta correspondiente, para que el usuario no pierda el plan que eligió.

## 5. Implementación

Cambio solo en el frontend, sin tocar el backend ni la base de datos.

| Archivo | Cambios |
|---|---|
| `frontend/inicio.html` | Pestañas y títulos renombrados, nuevos subtítulos, recuadro "¿Qué son estos planes?" con enlace a Mis planes, campo de búsqueda `#buscar-plan` y mensaje `#sin-resultados` en Votar planes. |
| `frontend/js/inicio.js` | Tarjetas con "Fecha del plan" y "Propuesto por" (ahora se lee `organizador_nombre`). Botón "Votar este plan →". `irAVotacion()` limpia la búsqueda y resalta la tarjeta. Nueva función `filtrarVotaciones()` (filtra por nombre y descripción). Enlaces internos `data-ir-tab` para cambiar de pestaña. |
| `frontend/css/base.css` | Estilos `.info-box`, `.buscador` y `.plan-card-resaltado`, con las variables de color y radio que ya existían. |

Se verificó en el navegador (Chromium, con Playwright):
- Se muestran las nuevas pestañas y el recuadro de ayuda.
- El botón lleva a la tarjeta correcta y la resalta.
- El buscador filtra y muestra el mensaje cuando no hay resultados.
- El enlace "Mis planes" cambia de pestaña.
- No hay errores de JavaScript.

## 6. Prueba con usuario

**Tarea que se le pidió al participante** (sin indicar qué pestaña o botón usar):

> "Entraste a Planazo y te contaron que hay un plan llamado **«_(nombre de un plan aprobado)_»**. Encuéntralo y vota que **sí** te apuntas. Después, dime quién lo propuso."

| Tarea | Participante (otro grupo) | Resultado (sin ayuda / con ayuda / no lo encontró) | Dónde dudó | Qué se ajustó después |
|---|---|---|---|---|
| Encontrar el plan indicado, votar "Sí" y decir quién lo propuso |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

## 7. Enlace al commit

- Commit de la mejora: [`8ce0ea6`](https://github.com/diego199D/p2-planazo/commit/8ce0ea623f0778c40816d89419c57523a06843bf)
