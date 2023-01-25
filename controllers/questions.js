const { Pool, Client } = require('pg');
const globals = require('./globals');
const mails = require('./mails');
const {getUserData} = require('./users');
module.exports.getMyQuestions =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
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
            filterArray.push({query:`AND (c.consulta LIKE XVARIABLEX OR c.mejora LIKE XVARIABLEX OR c.llamado LIKE XVARIABLEX OR c.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'creationDateE':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGTE':
            filterArray.push({query:`AND (c.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGT':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLTE':
            filterArray.push({query:`AND (c.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLT':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'idE':
            filterArray.push({query:`AND (c.enlace = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'idL':
            filterArray.push({query:`AND (c.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'stageE':
            filterArray.push({query:`AND (c.etapa = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'statusE':
            filterArray.push({query:`AND (c.estado = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusE':
            filterArray.push({query:`AND (t.nombre = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusL':
            filterArray.push({query:`AND (lower(t.descripcion) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
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
          SELECT
        (SELECT COUNT(*)
        from consultas c
    inner join bitacora_consultas_estados b on b.id_consulta = c.id
    inner join (
    select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
    group by bse.id_consulta
    ) bm
    on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
    inner join tareas t on b.tarea=t.nombre 
     WHERE c.usuario = $1
     and c.estado = '1'
     
          ${filterArray.map((filter)=>{
            return filter.query;
          }).join('\n')}
        ) as total, 
        (SELECT json_agg(t.*) FROM (
          SELECT c.*,
          --b.fecha_visualizacion as tarea_fecha_visualizacion, 
          b.fecha_creacion as tarea_fecha_asignacion,
          t.nombre as tarea_estado,
          t.descripcion as tarea_descripcion
          --,t.grupo as grupo_tarea,
          --t.encargado as tarea_encargado 
          from consultas c
    inner join bitacora_consultas_estados b on b.id_consulta = c.id
    inner join (
    select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
    group by bse.id_consulta
    ) bm
    on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
    inner join tareas t on b.tarea=t.nombre 
                  WHERE c.usuario = $1
                  and c.estado = '1'
            ${filterArray.map((filter)=>{
              return filter.query;
            }).join('\n')}
            ORDER BY c.fecha_creacion DESC
            LIMIT $2
            OFFSET $3
        ) AS t) AS data;
          `,[...[event.user.attributes.id,pagination.pageSize,(pagination.pageSize*(pagination.page-1))],
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

    return globals.sendResponse( result.rows[0]);
  };
  
  
module.exports.getQuestion =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    try{
      payload=JSON.parse(event.body);
      consulta={
        enlace:payload.link
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
        select c.*,
--b.fecha_visualizacion as tarea_fecha_visualizacion, 
b.fecha_creacion as tarea_fecha_asignacion,
t.nombre as tarea_estado,
t.descripcion as tarea_descripcion
--,t.grupo as grupo_tarea,
--t.encargado as tarea_encargado
,u.nombres,
u.apellidos 
from consultas c
    inner join bitacora_consultas_estados b on b.id_consulta = c.id
    inner join (
    select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
    group by bse.id_consulta
    ) bm
    on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
    inner join tareas t on b.tarea=t.nombre
    left join usuarios u on u.id = c.usuario
      where 
	  c.enlace = $1;`,[consulta.enlace]);
        await client.end();
        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    result['input']=event;
    if(result.rows.length===0){
      return globals.sendResponse({
        message: "consulta no disponible",
        code:"NOTFOUND",
        error:true,
        input:event
        },404);
    }
    return globals.sendResponse(result.rows[0]);
  };
  

  module.exports.addQuestion =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    event['user']=await getUserData(event);
  
    try{
      payload=JSON.parse(event.body);
      let checkParams=globals.validateParams(["question","better","stage","email","call","ocid","entity"],payload);
      if(checkParams.error){
        return globals.sendResponse({
          message: checkParams.message,
          error:true,
          input:event
          },404);
      }
      consulta={
      enlace:"E"+(new Date().getTime())+"C"+payload.call.trim(),
      consulta:payload.question,
      mejora:payload.better,
      etapa:payload.stage,
      correo:payload.email, 
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      llamado:payload.call,
      entidad:payload.entity,
      ocid:payload.ocid, 
      estado:1, 
      fecha_modificacion:null, 
      fecha_creacion:''
    };
    }catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
    } 
    
    /*const client = new Client();
    await client.connect();
    const res = await client.query*/
  
    
    let result={};
      try{
        const client = new Client();
        await client.connect();
        //const res = await client.query//await pool.query
        result = await client.query(`INSERT INTO public.consultas
        (enlace,consulta, mejora, etapa, correo, usuario, llamado, ocid,entidad, estado, fecha_modificacion, fecha_creacion)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9,$10,NULL, NOW()) RETURNING enlace,id;`,[consulta.enlace,consulta.consulta,consulta.mejora, consulta.etapa,consulta.correo,consulta.usuario,consulta.llamado,consulta.ocid,consulta.entidad,consulta.estado]);

        
        result_task = await client.query(`INSERT INTO public.bitacora_consultas_estados
        (id_consulta, tarea,justificacion, grupo_encargado, usuario_encargado, estado, fecha_visualizacion, fecha_modificacion, fecha_finalizacion,fecha_creacion)
        VALUES($1, (select t.nombre from tareas t where t.defecto = '1' and t.estado = '1' and t.grupo like '%CONSULTA%' limit 1),NULL, NULL, NULL, '1',NULL,NULL,NULL, NOW())  RETURNING id;`,[result.rows[0].id]);

        
        await client.end();
        //await pool.end();
        //console.log(event)
        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    result['input']=event;

    return globals.sendResponse(result);
  };


  module.exports.getQuestionsAgent =async (event) => {
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
            filterArray.push({query:`AND (c.consulta LIKE XVARIABLEX OR c.mejora LIKE XVARIABLEX OR c.llamado LIKE XVARIABLEX OR c.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'creationDateE':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGTE':
            filterArray.push({query:`AND (c.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGT':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLTE':
            filterArray.push({query:`AND (c.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLT':
            filterArray.push({query:`AND (c.TO_DATE(fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'asignationDateE':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'asignationDateGTE':
            filterArray.push({query:`AND (c.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'asignationDateGT':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'asignationDateLTE':
            filterArray.push({query:`AND (c.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'asignationDateLT':
            filterArray.push({query:`AND (TO_DATE(c.fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'idE':
            filterArray.push({query:`AND (c.enlace = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'idL':
            filterArray.push({query:`AND (c.enlace LIKE XVARIABLEX) `,variable:`%${payload[filter]}%`});
            break;
          case 'stageE':
            filterArray.push({query:`AND (c.etapa = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'statusE':
            filterArray.push({query:`AND (c.estado = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'callE':
            filterArray.push({query:`AND (c.llamado = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'linkD':
            filterArray.push({query:`AND (c.enlace <> XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'userE':
            filterArray.push({query:`AND (c.usuario = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusE':
            filterArray.push({query:`AND (t.nombre = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'taskStatusL':
            filterArray.push({query:`AND (lower(t.descripcion) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
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
          SELECT
        (SELECT COUNT(*) 
        from consultas c
    inner join bitacora_consultas_estados b on b.id_consulta = c.id
    inner join (
    select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
    group by bse.id_consulta
    ) bm
    on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
    inner join tareas t on b.tarea=t.nombre 
        where exists  (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
        )
        and c.estado = '1'
          ${filterArray.map((filter)=>{
            return filter.query;
          }).join('\n')}
        ) as total, 
        (SELECT json_agg(t.*) FROM (
          select c.*,
          b.fecha_visualizacion as tarea_fecha_visualizacion, 
          b.fecha_creacion as tarea_fecha_asignacion,
          t.nombre as tarea_estado,
          t.descripcion as tarea_descripcion,
          t.grupo as grupo_tarea,
          t.encargado as tarea_encargado 
          from consultas c
    inner join bitacora_consultas_estados b on b.id_consulta = c.id
    inner join (
    select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
    group by bse.id_consulta
    ) bm
    on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
    inner join tareas t on b.tarea=t.nombre   
          where exists  (select ru.rol from usuarios u 
          inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
          )
          and c.estado = '1'
            ${filterArray.map((filter)=>{
              return filter.query;
            }).join('\n')}
            ORDER BY b.fecha_creacion DESC
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

    return globals.sendResponse( result.rows[0]);
  };


  module.exports.getCountQuestionsAgent =async (event) => {
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
        select COUNT(*) as total from consultas c
        inner join bitacora_consultas_estados b on b.id_consulta = c.id
        inner join (
        select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse 
        group by bse.id_consulta
        ) bm
        on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
        inner join tareas t on b.tarea=t.nombre 
        where exists  (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
        )
        and b.fecha_visualizacion is null
        and t.nombre in ('ENVIADO')
        and c.estado = '1'
        and t.encargado like '%ASEPY%';
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

  exports.addQuestionStatus =async (event) => {
    //const { Pool, Client } = require('pg');crypto.createHash('SHA256').update((new Date().getTime())+"CLAIM"+payload.call).digest("hex")
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
      enlace:payload.link,
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      tarea:payload.task,
      justificacion:payload.justify
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
        //const res = await client.query//await pool.query
        result_update = await client.query(`UPDATE public.bitacora_consultas_estados
            SET fecha_finalizacion=NOW(),fecha_modificacion=NOW(), estado='0'
            WHERE id_consulta=(select c.id from consultas c where c.enlace =  $1 limit 1)
            and estado = '1'
            and exists  (select ru.rol from usuarios u 
              inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $2 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
             );`,[consulta.enlace,consulta.usuario]);

        result = await client.query(`INSERT INTO public.bitacora_consultas_estados
        (id_consulta, tarea,justificacion, grupo_encargado, usuario_encargado, estado, fecha_visualizacion, fecha_modificacion,fecha_finalizacion, fecha_creacion)
          (
            select (select c.id from consultas c where c.enlace =  $1 limit 1), $2,$4, NULL, NULL, '1',NULL,NULL,NULL, NOW() 
          where exists  (select ru.rol from usuarios u 
              inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $3 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
            )
          )
          RETURNING id;`,[consulta.enlace,consulta.tarea,consulta.usuario,consulta.justificacion]);
  
          await client.end();
          await mails.sendStatusTaskMail(
            {
              type:"question",
              link:consulta.enlace
              }
          );
        }
        
        catch(e){
        return globals.sendResponse({
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




  module.exports.getTasksQuestions =async (event) => {
    let payload={};
    let consulta={};
    try{
      payload=JSON.parse(event.body);
      consulta={
        
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
        select t.nombre as name, t.descripcion as description, t.encargado as "owner" from public.tareas t where t.defecto <> '1' and grupo like $1;`,['%CONSULTA%']);
        await client.end();
        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    result['input']=event;
    return globals.sendResponse(result.rows);
  };


  
exports.updateQuestionStatusVisualization =async (event) => {
  //const { Pool, Client } = require('pg');crypto.createHash('SHA256').update((new Date().getTime())+"CLAIM"+payload.call).digest("hex")
  let payload={};
  let consulta={};


  event['user']=await getUserData(event,['ASEPY','SUPERASEPY']);
    if(event?.user?.error){
      return globals.sendResponse({
        message: event?.user?.message,
        error:true
        },404);
    }
  try{

    payload=JSON.parse(event.body);
    let checkParams=globals.validateParams(["link"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
    consulta={
    enlace:payload.link,
    usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null
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
      
      result = await client.query(`UPDATE public.bitacora_consultas_estados
      SET fecha_visualizacion=NOW()
      WHERE id_consulta=(select c.id from consultas c where c.enlace =  $1 limit 1)
      and estado = '1'
      and tarea in ('ENVIADO')
      and exists  (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $2 and ru.rol in ('SUPER','ASEPY','SUPERASEPY') and u.estado = '1' and ru.estado = '1'
       );`,[consulta.enlace,consulta.usuario]);
              

      await client.end();
      
      }
      
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    }
  

  
  result['input']=event;
  

  return globals.sendResponse(
    {ok:true, result:result.rows}
  );
};