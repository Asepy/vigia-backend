const { Pool, Client } = require('pg');
const globals = require('./globals');
const {getUserData} = require('./users');



module.exports.getUOCTasksInfo =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    try{
      payload=JSON.parse(event.body);
      let checkParams=globals.validateParams(["entity"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
      consulta={
        entidad:payload.entity
    };
    }catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
          },404);
    } 
    
    
    
    let result={};
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
with claims as (
            select r.* from reclamos r where r.entidad = $1
),

questions as (
            select c.* from consultas c where c.entidad = $1
),

join_task_claims as (
SELECT r.enlace,t.nombre as tarea_nombre, t.encargado as tarea_encargado
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
select c.enlace,t.nombre as tarea_nombre, t.encargado as tarea_encargado
from questions c
inner join bitacora_consultas_estados b on b.id_consulta = c.id
inner join (
select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
group by bse.id_consulta
) bm
on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
inner join tareas t on b.tarea=t.nombre 
),


count_claims as (
SELECT COUNT(*) as total
from join_task_claims jtc
where jtc.tarea_nombre like '%RESUELTO%'),

count_questions as (
SELECT COUNT(*) as total
from join_task_questions jtq
where jtq.tarea_nombre like '%RESUELTO%'
),
count_in_process_claims as (
SELECT COUNT(*) as total
from join_task_claims jtc
where jtc.tarea_nombre not like '%RESUELTO%' and jtc.tarea_encargado = 'UOC'
),

count_in_process_questions as (
SELECT COUNT(*) as total
from join_task_questions jtq
where jtq.tarea_nombre not like '%RESUELTO%' and jtq.tarea_encargado = 'UOC'
),
claims_time_to_resolve as (
	select 'claims' as "source",
	date_part('day', b.fecha_finalizacion - b.fecha_creacion) as dias,
	date_part('hours', b.fecha_finalizacion - b.fecha_creacion) as horas,
	date_part('minutes', b.fecha_finalizacion - b.fecha_creacion) as minutos,
	date_part('seconds', b.fecha_finalizacion - b.fecha_creacion) as segundos
	from claims r
	inner join bitacora_reclamos_estados b on b.id_reclamo = r.id 
	inner join tareas t on b.tarea = t.nombre
	where t.encargado = 'UOC'
	and b.fecha_finalizacion is not null
), questions_time_to_resolve as (
	select 'questions' as "source",
	date_part('day', b.fecha_finalizacion - b.fecha_creacion) as dias,
	date_part('hours', b.fecha_finalizacion - b.fecha_creacion) as horas,
	date_part('minutes', b.fecha_finalizacion - b.fecha_creacion) as minutos,
	date_part('seconds', b.fecha_finalizacion - b.fecha_creacion) as segundos
	from questions c
	inner join bitacora_consultas_estados b on b.id_consulta = c.id 
	inner join tareas t on b.tarea = t.nombre
	where t.encargado = 'UOC'
	and b.fecha_finalizacion is not null
),
time_to_resolve as (
	select * from claims_time_to_resolve
	union
	select * from questions_time_to_resolve
)


select (select total from count_claims) as reclamos_resueltos,
(select total from count_questions) as consultas_aclaradas,
((select total from count_in_process_questions) + (select total from count_in_process_claims)) as en_proceso,
(select (round(sum(t.dias*24 + t.minutos/60 + t.segundos/3600 + t.horas)::numeric, 2) / count(*)) as avg_time
from time_to_resolve as t) as horas_promedio;`,[consulta.entidad]);
await client.end();
        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    return globals.sendResponse(result.rows[0]);
  };



  module.exports.getUOCRequests =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    let pagination={};

    try{
      payload=JSON.parse(event.body);
      let checkParams=globals.validateParams(["entity"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
      consulta={
        entidad:payload.entity
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
            filterArray.push({query:`AND (r.llamado LIKE XVARIABLEX OR r.enlace LIKE XVARIABLEX OR to_char(r.fecha_creacion,'DD/MM/YYYY') LIKE XVARIABLEX OR r.etapa LIKE XVARIABLEX OR r.tarea_descripcion LIKE XVARIABLEX OR r.tarea_encargado LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'creationDateE':
            filterArray.push({query:`AND (TO_DATE(r.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGTE':
            filterArray.push({query:`AND (r.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGT':
            filterArray.push({query:`AND (TO_DATE(r.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLTE':
            filterArray.push({query:`AND (r.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLT':
            filterArray.push({query:`AND (TO_DATE(r.fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'idE':
            filterArray.push({query:`AND (r.enlace = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'idL':
            filterArray.push({query:`AND (r.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'stageE':
            filterArray.push({query:`AND (r.etapa = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'statusE':
            filterArray.push({query:`AND (r.estado = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusE':
            filterArray.push({query:`AND (r.tarea_estado = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusL':
            filterArray.push({query:`AND (r.tarea_descripcion LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
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
          select r.* from reclamos r where r.entidad = $1
),

questions as (
          select c.* from consultas c where c.entidad = $1
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
)
        
        SELECT
      (SELECT COUNT(*) 
      from requests r
      WHERE TRUE
        ${filterArray.map((filter)=>{
          return filter.query;
        }).join('\n')}
      ) as total, 
      (SELECT json_agg(t.*) FROM (
          SELECT r.*
          from requests r
          WHERE TRUE
          ${filterArray.map((filter)=>{
            return filter.query;
          }).join('\n')}
          ORDER BY r.fecha_creacion DESC
          LIMIT $2
          OFFSET $3
      ) AS t) AS data;
        `,[...[consulta.entidad,pagination.pageSize,(pagination.pageSize*(pagination.page-1))],
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

  module.exports.getUOCContactPoint =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    try{
      payload=JSON.parse(event.body);
      let checkParams=globals.validateParams(["entity"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
      consulta={
        entidad:payload.entity
    };
    }catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
          },404);
    } 
    
    
    
    let result={};
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
        select e.entidad, (SELECT json_agg(t.*) FROM (
          SELECT distinct on (contact_point_email) contact_point_email, contact_point_name, contact_point_telephone
          from ocds.parties
          where party_id = e.entidad and (contact_point_email is not null or contact_point_telephone is not null)
      ) AS t) AS data from  (
select distinct entidad as entidad  from consultas c union
(select distinct entidad as entidad from reclamos r)  
) e where e.entidad = $1`,[consulta.entidad]);
await client.end();
        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    return globals.sendResponse(result.rows[0]);
  };
