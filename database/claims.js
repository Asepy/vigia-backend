const { Client } = require("pg");

async function getClaimByEnlace(enlace) {
  let claim = {};
  let extraQuestions = [];
  try {
    const client = new Client();
    await client.connect();
    const result = await client.query(
      `
      SELECT r.*,
      --b.fecha_visualizacion as tarea_fecha_visualizacion,
      b.fecha_creacion as tarea_fecha_asignacion,
      t.nombre as tarea_estado,
      t.descripcion as tarea_descripcion
      --,t.grupo as grupo_tarea,
      --t.encargado as tarea_encargado
      ,u.nombres,
      u.apellidos
      FROM reclamos r
      inner join bitacora_reclamos_estados b on b.id_reclamo::bigint = r.id
      inner join (
      SELECT bse.id_reclamo, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_reclamos_estados bse
      group by bse.id_reclamo
      ) bm
      on bm.fecha_creacion = b.fecha_creacion and bm.id_reclamo = b.id_reclamo
      inner join tareas t on b.tarea=t.nombre
      left join usuarios u on u.id = r.usuario
      where r.enlace = $1;`,
      [enlace]
    );
    claim = result.rows && result.rows.length > 0 ? result.rows[0] : {};
    const resultExtra = await client.query(
      `
      SELECT campos.*,respuestas.respuesta, respuestas.id id_respuesta
      FROM public.respuestas_campos respuestas INNER JOIN
      public.campos campos ON campos.nombre = respuestas.nombre_campo
      WHERE respuestas.id_reclamo = $1 AND respuestas.estado = '1';`,
      [claim.id]
    );
    extraQuestions = resultExtra.rows
    await client.end();
  } catch (e) {
    throw e;
  }
  return {
    ...claim,
    ...{
      extraQuestions,
    },
  };
}

module.exports = {
  getClaimByEnlace,
};

/*
export interface Question {
  id: string;
  nombre: string;
  titulo: string;
  tipo: string;
  estado: string;
  fecha_creacion: string;
  fecha_modificacion: string | null;
  grupo: string;
  id_respuesta: string;
  respuesta: string;
  nombres?: string;
  apellidos?: string;
}

export interface Claim {
  afeccion: string;
  correo: string;
  enlace: string;
  entidad: string;
  estado: string;
  etapa: string;
  extraQuestions: Question[];
  fecha_creacion: string;
  fecha_modificacion: string | null;
  id: string;
  llamado: string;
  ocid: string;
  reclamo: string;
  tarea_descripcion: string;
  tarea_estado: string;
  tarea_fecha_asignacion: string;
  usuario: string;
  nombres?: string;
  apellidos?: string;
}
*/
