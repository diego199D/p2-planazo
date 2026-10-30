const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const rutaBase = path.join(__dirname, "../database/planazo.db");
const esquema = fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8");
const db = new Database(rutaBase);

db.exec(esquema);

const columnas = db.prepare("PRAGMA table_info(planes)").all();
const tieneOrganizador = columnas.some(function (columna) {
  return columna.name === "organizador";
});

if (!tieneOrganizador) {
  db.exec("ALTER TABLE planes ADD COLUMN organizador TEXT");
}

module.exports = db;
