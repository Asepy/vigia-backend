const globals = require("./globals");
const { getClaimByEnlace } = require("../database/claims");
const { getQuestionByEnlace } = require("../database/questions");
const { createTweetOnDB,deleteTweetOnDB } = require("../database/tweets");
const { CONSULTA } = require("../enums");
const { createTweetOnAPI,deleteTweetOnAPI } = require("../twitter_api");
const { getUserData } = require("./users");
const { Client } = require("pg");

module.exports.createTweet = async (event) => {
  let data = {};
  try {
    const { tweet, enlace, tipo } = JSON.parse(event.body);
    let checkParams=globals.validateParams(["tweet","enlace","tipo"],JSON.parse(event.body));
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
    const user = await getUserData(event,['ASEPY','SUPERASEPY','SUPER']);
    if (user.error) {
      return globals.sendResponse(
        {
          message: user.message,
          error: true,
          input: event,
        },
        403
      );
    }




    const obj =
      tipo === CONSULTA
        ? await getQuestionByEnlace(enlace)
        : await getClaimByEnlace(enlace);
    const twit = await createTweetOnAPI(tweet);


    data = await createTweetOnDB({
      id_tweet: twit.id,
      tweet: twit.text,
      id_reclamo_consulta: obj.id,
      tipo_solicitud: tipo, // Consulta o Reclamo
      usuario: user?.attributes?.id,
      estado: obj.estado,
    });
  } catch (e) {
    return globals.sendResponse(
      {
        message: e.message,
        error: true,
        input: event,
      },
      404
    );
  }
  return globals.sendResponse({ data });
};

module.exports.deleteTweet = async (event) => {
  let data = {};
  try {
    const { tweet_id } = JSON.parse(event.body);
    let checkParams=globals.validateParams(["tweet_id"],JSON.parse(event.body));
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
    const user = await getUserData(event,['ASEPY','SUPERASEPY','SUPER']);
    if (user.error) {
      return globals.sendResponse(
        {
          message: user.message,
          error: true,
          input: event,
        },
        403
      );
    }



    const response = await deleteTweetOnAPI(tweet_id);


    data = await deleteTweetOnDB({
      id_tweet: tweet_id,
      usuario: user?.attributes?.id
    });
  } catch (e) {
    return globals.sendResponse(
      {
        message: e.message,
        error: true,
        input: event,
      },
      404
    );
  }
  return globals.sendResponse({ data });
};


module.exports.getUsersTweets = async (event) =>  {
  //const { Pool, Client } = require('pg');
  let payload={};
  let consulta={};
  let pagination={};

  try{
    event['user']= await getUserData(event,['ASEPY','SUPERASEPY','SUPER']);
    if (event?.user?.error) {
      return globals.sendResponse(
        {
          message: event?.user?.message,
          error: true,
          input: event,
        },
        403
      );
    }
    payload=JSON.parse(event.body);
    consulta={
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null
    };

    
    pagination={
      page:globals.getNumber(payload.page)?globals.getNumber(payload.page):1,
      pageSize:globals.getNumber(payload.pageSize)?globals.getNumber(payload.pageSize):5,
    }
  }catch(e){
    return globals.sendResponse( {
      message: e.message,
      error:true,
      input:event
    },404);
  } 
  
  
  
  let result={};
  let filterArray=[];

  for (let filter of Object.keys(payload)){
    if(globals.validateString(payload[filter])){
      switch(filter){
        case 'search':
          filterArray.push({query:`AND (t.llamado LIKE XVARIABLEX OR lower(t.enlace) LIKE lower(XVARIABLEX) OR to_char(t.fecha_creacion,'DD/MM/YYYY') LIKE XVARIABLEX OR t.etapa LIKE XVARIABLEX OR lower(t.tarea_descripcion) LIKE lower(XVARIABLEX) OR lower(t.tarea_encargado) LIKE lower(XVARIABLEX) OR lower(t.correo_usuario) LIKE lower(XVARIABLEX)  OR lower(t.nombre_usuario) LIKE lower(XVARIABLEX) OR lower(t.tweet) LIKE lower(XVARIABLEX) OR lower(t.estado_tweet) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
          break;
        case 'creationDateE':
          filterArray.push({query:`AND (TO_DATE(t.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'creationDateGTE':
          filterArray.push({query:`AND (t.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'creationDateGT':
          filterArray.push({query:`AND (TO_DATE(t.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
          break;
        case 'creationDateLTE':
          filterArray.push({query:`AND (t.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'creationDateLT':
          filterArray.push({query:`AND (TO_DATE(t.fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
          break;
        case 'idE':
          filterArray.push({query:`AND (t.enlace = XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'idL':
          filterArray.push({query:`AND (t.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
          break;
        case 'stageE':
          filterArray.push({query:`AND (t.etapa = XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'statusE':
          filterArray.push({query:`AND (t.estado = XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'taskStatusE':
          filterArray.push({query:`AND (t.tarea_estado = XVARIABLEX) `,variable:`${payload[filter]}`});
          break;
        case 'taskStatusL':
          filterArray.push({query:`AND (t.tarea_descripcion LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
          break;
          case 'mailL':
            filterArray.push({query:`AND (lower(t.correo_usuario) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
            case 'tweetStatusE':
            filterArray.push({query:`AND (lower(t.estado_tweet) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
        default:
      }
    }
  }
  filterArray=filterArray.map(
    (filter,index)=>{
      return {query:filter.query.replace(/XVARIABLEX/g,`$${(index+4)}`), variable : filter.variable};
    }
  )


    try{
      const client = new Client();
      await client.connect();
      result = await client.query(`
      with claims as (
        select r.* from reclamos r 
),

questions as (
        select c.* from consultas c 
),
join_task_claims as (
SELECT 
r.id as id,
r.enlace as enlace,
'RECLAMO' as tipo,
r.etapa as etapa,
r.fecha_creacion as fecha_creacion,
r.llamado as llamado,
t.nombre as tarea_estado, 
t.descripcion  as tarea_descripcion,
t.encargado as tarea_encargado
from claims r
inner join bitacora_reclamos_estados b on b.id_reclamo::bigint = r.id
inner join (
select bse.id_reclamo, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_reclamos_estados bse
group by bse.id_reclamo
) bm
on bm.fecha_creacion = b.fecha_creacion and bm.id_reclamo = b.id_reclamo
inner join tareas t on b.tarea=t.nombre
),
join_task_questions as (
select 
c.id as id,
c.enlace as enlace,
'CONSULTA' as tipo,
c.etapa as etapa,
c.fecha_creacion as fecha_creacion,
c.llamado as llamado,
t.nombre as tarea_estado, 
t.descripcion  as tarea_descripcion,
t.encargado as tarea_encargado
from questions c
inner join bitacora_consultas_estados b on b.id_consulta = c.id
inner join (
select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
group by bse.id_consulta
) bm
on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
inner join tareas t on b.tarea=t.nombre 
),
requests as (
select * from join_task_claims union
select * from join_task_questions
),




tweets_merge as(
select t.*,
u.nombres as nombre_usuario,
u.correo as correo_usuario,
r.enlace as enlace, r.etapa as etapa, r.fecha_creacion as fecha_creacion_solicitud, r.tarea_descripcion as tarea_descripcion, r.tarea_encargado as tarea_encargado,
r.llamado as llamado,
(case WHEN (t.estado  ='1') THEN 'ACTIVO'
ELSE
 'ELIMINADO'
end) as estado_tweet
from tweets t 
inner join usuarios u on u.id= t.usuario
inner join requests r on r.id::bigint= t.id_reclamo_consulta::bigint and r.tipo = t.tipo_solicitud)



      
      SELECT
    (SELECT COUNT(*) 
    from tweets_merge t 
    where exists  (select ru.rol from usuarios u 
      inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
      )
      ${filterArray.map((filter)=>{
        return filter.query;
      }).join('\n')}
    ) as total, 
    (SELECT json_agg(t.*) FROM (
        SELECT t.*
        from tweets_merge t 
        where exists  (select ru.rol from usuarios u 
          inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
          )
        ${filterArray.map((filter)=>{
          return filter.query;
        }).join('\n')}
        ORDER BY t.fecha_creacion DESC
        LIMIT $2
        OFFSET $3
    ) AS t) AS data;
      `,[...[consulta.usuario,pagination.pageSize,(pagination.pageSize*(pagination.page-1))],
        ...filterArray.map((filter)=>{
          return filter.variable;
        })
    ]);
      await client.end();
      }
      catch(e){

      return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
  result['input']=event;

  return globals.sendResponse(
    result.rows[0]
  );
};
