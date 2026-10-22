function exito(res, { datos = null, mensaje = null, codigo = 200 } = {}) {
  const cuerpo = { exito: true };
  if (mensaje) cuerpo.mensaje = mensaje;
  cuerpo.datos = datos;
  return res.status(codigo).json(cuerpo);
}

function error(res, { mensaje = "Error inesperado", codigo = 400, errores = null } = {}) {
  const cuerpo = { exito: false, mensaje };
  if (errores) cuerpo.errores = errores;
  return res.status(codigo).json(cuerpo);
}

module.exports = { exito, error };
