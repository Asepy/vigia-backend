const { Client } = require("pg");

async function getQuestionByEnlace(enlace) {
  let question = {};
  try {
    const client = new Client();
    await client.connect();
    const result = await client.query(
      `
      SELECT c.*,
        --b.fecha_visualizacion as tarea_fecha_visualizacion,
        b.fecha_creacion as tarea_fecha_asignacion,
        t.nombre as tarea_estado,
        t.descripcion as tarea_descripcion
        --,t.grupo as grupo_tarea,
        --t.encargado as tarea_encargado
        ,u.nombres,
        u.apellidos
      FROM consultas c
        inner join bitacora_consultas_estados b on b.id_consulta = c.id
        inner join (
          SELECT bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse
            group by bse.id_consulta
          ) bm
        on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
        inner join tareas t on b.tarea=t.nombre
        left join usuarios u on u.id = c.usuario
      WHERE c.enlace = $1;`,
      [enlace]
    );
    question = result.rows && result.rows.length > 0 ? result.rows[0] : {};
    await client.end();
  } catch (e) {
    throw e;
  }
  return question;
}

module.exports = {
  getQuestionByEnlace,
};
