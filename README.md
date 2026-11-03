# Planazo — Setup Multiusuario

## Pasos para arrancar

### 1. Abre XAMPP y enciende MySQL

### 2. Inicializa la base de datos
```bash
npm run init-db
```
Esto crea la base de datos, las tablas y el usuario admin automáticamente.

### 3. Arranca el servidor
```bash
npm start
```

### 4. Abre en el navegador
```
http://localhost:3000/login.html
```

---

## Credenciales del admin
- **Correo:** admin@gmail.com
- **Contraseña:** 12345678

---

## Configuración (.env)
Si tu MySQL tiene contraseña, edita el archivo `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=planazo
JWT_SECRET=planazo_super_secreto_2024
PORT=3000
```

---

## Roles y funcionalidades

| Función | Usuario | Admin |
|---------|---------|-------|
| Ver planes base | ✅ | ✅ |
| Crear plan personal | ✅ | ✅ |
| Votar en planes | ✅ | ✅ |
| Ver estado de sus planes | ✅ | ✅ |
| Aprobar/rechazar planes | ❌ | ✅ |
| Crear plan base directamente | ❌ | ✅ |
| Ver todos los usuarios | ❌ | ✅ |

---

## Tests
```bash
pnpm exec playwright test --project=chromium --reporter=list
```
