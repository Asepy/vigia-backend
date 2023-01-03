const { Pool, Client } = require('pg');
const globals = require('./globals');
const {getUserData} = require('./users');

  module.exports.getRequestsReport =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    let pagination={};

    event['user']=await getUserData(event);
    if(event?.user?.error){
      return globals.sendResponse({
        message: event?.user?.message,
        error:true
        },404);
    }

    try{
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
        return {query:filter.query.replace(/XVARIABLEX/g,`$${(index+(payload.fullRecords?2:4))}`), variable : filter.variable};
      }
    )
  
  
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
        with join_task_claims as (
            SELECT 
            r.id as id,
            r.enlace as enlace,
            'RECLAMO' as tipo,
            r.etapa as etapa,
            r.fecha_creacion as fecha_creacion,
            r.llamado as llamado,
            t.nombre as tarea_estado, 
            t.descripcion  as tarea_descripcion,
            t.encargado as tarea_encargado,
            r.entidad  as entidad,
            r.ocid as ocid,
            b.fecha_creacion as fecha_creacion_tarea
            from reclamos r
            inner join bitacora_reclamos_estados b on b.id_reclamo = r.id
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
            t.encargado as tarea_encargado,
            c.entidad as entidad,
            c.ocid as ocid,
            b.fecha_creacion as fecha_creacion_tarea
            from consultas c
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
      where exists  (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
        )
        ${filterArray.map((filter)=>{
          return filter.query;
        }).join('\n')}
      ) as total, 
      (SELECT json_agg(t.*) FROM (
          SELECT r.*
          from requests r
          where exists  (select ru.rol from usuarios u 
            inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
            )
          ${filterArray.map((filter)=>{
            return filter.query;
          }).join('\n')}
          ORDER BY r.fecha_creacion DESC
          ${
            (payload.fullRecords?``:`
            LIMIT $2
            OFFSET $3
            `)
          }
      ) AS t) AS data;
        `,[...[consulta.usuario],
          ...(payload.fullRecords?[]:[pagination.pageSize,(pagination.pageSize*(pagination.page-1))]),
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


/*
module.exports.getCountRequestReport =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    event['user']=await getUserData(event);
    if(event?.user?.error){
      return globals.sendResponse({
        message: event?.user?.message,
        error:true
        },404);
    }

    try{
      payload=JSON.parse(event.body);
      consulta={
        usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null
      };
  
      
    }catch(e){
      return globals.sendResponse( {
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
        with join_task_claims as (
            SELECT 
            r.id as id,
            r.enlace as enlace,
            'RECLAMO' as tipo,
            r.etapa as etapa,
            r.fecha_creacion as fecha_creacion,
            r.llamado as llamado,
            t.nombre as tarea_estado, 
            t.descripcion  as tarea_descripcion,
            t.encargado as tarea_encargado,
            r.entidad  as entidad,
            b.fecha_creacion as fecha_creacion_tarea
            from reclamos r
            inner join bitacora_reclamos_estados b on b.id_reclamo = r.id
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
            t.encargado as tarea_encargado,
            c.entidad as entidad,
            b.fecha_creacion as fecha_creacion_tarea
            from consultas c
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



            resueltos as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO%'),
            pendientes as
            (select count(*) as total from requests where tarea_estado not like '%RESUELTO%' and tarea_encargado not in ('Usuario') ),
            devueltos as
            (select count(*) as total from requests where tarea_estado like '%DEVUELTO%'),
            
            calculados as (
            select
            (select total from resueltos) as resueltos,
            (select total from pendientes) as pendientes,
            (select total from devueltos) as devueltos)
            
            select c.resueltos, c.pendientes, c.devueltos, (c.resueltos+ c.pendientes+ c.devueltos) as total from calculados c
            where exists  (select ru.rol from usuarios u 
                inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
                )
  
        `,[...[consulta.usuario]
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
  */

  
  module.exports.getCountRequestReport  =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    let pagination={};

    event['user']=await getUserData(event);
    if(event?.user?.error){
      return globals.sendResponse({
        message: event?.user?.message,
        error:true
        },404);
    }

    try{
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
        return {query:filter.query.replace(/XVARIABLEX/g,`$${(index+2)}`), variable : filter.variable};
      }
    )
  
  
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
        with join_task_claims as (
            SELECT 
            r.id as id,
            r.enlace as enlace,
            'RECLAMO' as tipo,
            r.etapa as etapa,
            r.fecha_creacion as fecha_creacion,
            r.llamado as llamado,
            t.nombre as tarea_estado, 
            t.descripcion  as tarea_descripcion,
            t.encargado as tarea_encargado,
            r.entidad  as entidad,
            r.ocid as ocid,
            b.fecha_creacion as fecha_creacion_tarea
            from reclamos r
            inner join bitacora_reclamos_estados b on b.id_reclamo = r.id
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
            t.encargado as tarea_encargado,
            c.entidad as entidad,
            c.ocid as ocid,
            b.fecha_creacion as fecha_creacion_tarea
            from consultas c
            inner join bitacora_consultas_estados b on b.id_consulta = c.id
            inner join (
            select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
            group by bse.id_consulta
            ) bm
            on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
            inner join tareas t on b.tarea=t.nombre 
            ),
            pre_requests as (
            select * from join_task_claims union
            select * from join_task_questions
            ),
            requests as (
                select r.* from pre_requests r
                where exists  (select ru.rol from usuarios u 
                    inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado='1'
                    )
                ${filterArray.map((filter)=>{
                    return filter.query;
                }).join('\n')}
            ),

            resueltos as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO%'),
            pendientes as
            (select count(*) as total from requests where tarea_estado not like '%RESUELTO%' and tarea_encargado not in ('Usuario') ),
            devueltos as
            (select count(*) as total from requests where tarea_estado like '%DEVUELTO%'),
            
            calculados as (
            select
            (select total from resueltos) as resueltos,
            (select total from pendientes) as pendientes,
            (select total from devueltos) as devueltos)
            
            select c.resueltos, c.pendientes, c.devueltos, (c.resueltos+ c.pendientes+ c.devueltos) as total from calculados c;
        `,[...[consulta.usuario],
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
            input:event,
            par:filterArray.map((filter)=>{
            return filter.variable;
          })
            },404);
      } 
    
    result['input']=event;
  
    return globals.sendResponse(
      result.rows[0]
    );
  };
