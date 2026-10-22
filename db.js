const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "..", "..", "database.sqlite");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// -----------------------------------------------------------------------
// Esquema relacional (rol, usuario, proyecto, categoria, tarea, token_acceso)
// -----------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS rol (
  id_rol      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario  INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  usuario     VARCHAR(50)  NOT NULL UNIQUE,
  correo      VARCHAR(120) NOT NULL UNIQUE,
  contrasena  VARCHAR(255) NOT NULL,
  id_rol      INTEGER NOT NULL,
  estado      VARCHAR(10) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO')),
  FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

CREATE TABLE IF NOT EXISTS proyecto (
  id_proyecto   INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        VARCHAR(120) NOT NULL,
  descripcion   TEXT,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE,
  estado        VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE'
                CHECK (estado IN ('PENDIENTE','EN_PROCESO','FINALIZADO')),
  id_usuario    INTEGER NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       VARCHAR(60) NOT NULL UNIQUE,
  descripcion  VARCHAR(150),
  estado       VARCHAR(10) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','INACTIVA'))
);

CREATE TABLE IF NOT EXISTS tarea (
  id_tarea      INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo        VARCHAR(120) NOT NULL,
  descripcion   TEXT,
  id_proyecto   INTEGER NOT NULL,
  id_categoria  INTEGER,
  prioridad     VARCHAR(6) NOT NULL DEFAULT 'MEDIA' CHECK (prioridad IN ('BAJA','MEDIA','ALTA')),
  estado        VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE'
                CHECK (estado IN ('PENDIENTE','EN_PROCESO','COMPLETADA')),
  fecha_limite  DATE,
  FOREIGN KEY (id_proyecto)  REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
);

CREATE TABLE IF NOT EXISTS token_acceso (
  id_token        INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario      INTEGER NOT NULL,
  token           VARCHAR(255) NOT NULL UNIQUE,
  fecha_creacion  DATETIME NOT NULL,
  fecha_expiracion DATETIME NOT NULL,
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);
`);

module.exports = db;
