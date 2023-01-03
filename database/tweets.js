const { Client } = require("pg");

async function createTweetOnDB({
  id_tweet,
  tweet,
  id_reclamo_consulta,
  tipo_solicitud,
  usuario,
  estado,
}) {
  let tweetRow = {};
  try {
    const client = new Client();
    await client.connect();
    const result = await client.query(
      `
      INSERT INTO public.tweets
      (id_tweet, tweet, id_reclamo_consulta, tipo_solicitud, usuario, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, $4, $5, $6, NULL, NOW())
      RETURNING id_tweet, tweet, id_reclamo_consulta, tipo_solicitud, usuario, estado, fecha_modificacion, fecha_creacion;
      `,
      [id_tweet, tweet, id_reclamo_consulta, tipo_solicitud, usuario, estado]
    );
    tweetRow = result.rows && result.rows.length > 0 ? result.rows[0] : {};
    await client.end();
  } catch (e) {
    throw e;
  }
  return tweetRow;
}

async function deleteTweetOnDB({
  id_tweet,
  usuario,
}) {
  let tweetRow = {};
  try {
    const client = new Client();
    await client.connect();
    const result = await client.query(
      `UPDATE public.tweets
      SET fecha_modificacion=NOW(), estado='0'
      WHERE id_tweet=$1
      and exists  (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $2 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
       );`,
      [id_tweet, usuario]
    );
    tweetRow = result.rows && result.rows.length > 0 ? result.rows[0] : {};
    await client.end();
  } catch (e) {
    throw e;
  }
  return tweetRow;
}

module.exports = {
  createTweetOnDB,
  deleteTweetOnDB
};
