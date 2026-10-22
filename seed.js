const bcrypt = require("bcryptjs");
const db = require("./db");

function seed() {
  const contarUsuarios = db.prepare("SELECT COUNT(*) AS n FROM usuario").get().n;
  if (contarUsuarios > 0) {
    console.log("La base de datos ya tiene datos. Seed omitido.");
    return;
  }

  const insertarRol = db.prepare(
    "INSERT INTO rol (nombre, descripcion) VALUES (?, ?)"
  );
  const idAdmin = insertarRol.run("ADMINISTRADOR", "Acceso total al sistema").lastInsertRowid;
  const idUsuario = insertarRol.run("USUARIO", "Acceso limitado a sus propios recursos").lastInsertRowid;

  const insertarUsuario = db.prepare(`
    INSERT INTO usuario (nombre, usuario, correo, contrasena, id_rol, estado)
    VALUES (@nombre, @usuario, @correo, @contrasena, @id_rol, @estado)
  `);

  const usuarios = [
    { nombre: "Administrador", usuario: "admin", correo: "admin@correo.com", contrasena: "Admin2026*", id_rol: idAdmin, estado: "ACTIVO" },
    { nombre: "Ana Lopez",     usuario: "ana",   correo: "ana@correo.com",   contrasena: "Ana2026*",   id_rol: idUsuario, estado: "ACTIVO" },
    { nombre: "Carlos Ruiz",   usuario: "carlos",correo: "carlos@correo.com",contrasena: "Carlos2026*",id_rol: idUsuario, estado: "ACTIVO" },
    { nombre: "Usuario Inactivo", usuario: "inactivo", correo: "inactivo@correo.com", contrasena: "Inactivo2026*", id_rol: idUsuario, estado: "INACTIVO" },
  ];

  for (const u of usuarios) {
    insertarUsuario.run({
      ...u,
      contrasena: bcrypt.hashSync(u.contrasena, 10),
    });
  }

  const insertarCategoria = db.prepare(
    "INSERT INTO categoria (nombre, descripcion, estado) VALUES (?, ?, ?)"
  );
  insertarCategoria.run("Desarrollo", "Tareas de desarrollo de software", "ACTIVA");
  insertarCategoria.run("Diseño", "Tareas de diseño UI/UX", "ACTIVA");
  insertarCategoria.run("Pruebas", "Tareas de QA y testing", "ACTIVA");
  insertarCategoria.run("Documentación", "Tareas de documentación", "INACTIVA");

  console.log("Seed completado: roles, usuarios y categorías creados.");
}

seed();
