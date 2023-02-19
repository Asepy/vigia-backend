const { Pool, Client } = require('pg');
const globals = require('./globals');
const {getUserData} = require('./users');


module.exports.getCountData  =async (event) => {
    //const { Pool, Client } = require('pg');

    

    try{
        let authorizationHeader = event.headers.Authorization;


        if (!authorizationHeader){
            return globals.sendResponse( {
                message: 'Unauthorized',
                error:true
                },401);
        }

        let encodedCreds = authorizationHeader.split(' ')[1];
        let plainCreds = (Buffer.from(encodedCreds, 'base64')).toString().split(':');
        let username = plainCreds[0];
        let password = plainCreds[1];

        if (!(username === 'test' && password === 'secret')){
            return globals.sendResponse( {
                message: e.message,
                error:true,
                input:event
                },404);
        } 
    }catch(e){
  
        return globals.sendResponse( {
            message: e.message,
            error:true,
            input:event
            },404);
    }


    let payload={};



 
    
    let result={};
    let response={
        "reclamos_en_gestion":{
            "count":0,
            "description":"Reclamos actualmente en gestion, que todavia no han sido devueltos o tenido algun tipo de resolucion"
        },
        "consultas_en_gestion":{
            "count":0,
            "description":"Consultas actualmente en gestion, que todavia no han sido devueltas o tenido algun tipo de resolucion o respuesta"
        },
        "reclamos_enviados":{
            "count":0,
            "description":"Total de reclamos enviados por los usuarios"
        },
        "consultas_enviadas":{
            "count":0,
            "description":"Total de consultas enviadas por los usuarios"
        },
        "consultas_devueltas":{
            "count":0,
            "description":"Total de consultas devueltas por no ser claras u otros motivos"
        },
        "reclamos_devueltos":{
            "count":0,
            "description":"Total de reclamos devueltos por no tener fundamentos u otros motivos"
        },
        "reclamos_finalizados_satisfactoriamente":{
            "count":0,
            "description":"Total de reclamos resueltos satisfactoriamente"
        },
        "consultas_finalizadas_satisfactoriamente":{
            "count":0,
            "description":"Total de consultas resueltas satisfactoriamente"
        },
        "reclamos_finalizados_insatisfactoriamente":{
            "count":0,
            "description":"Total de reclamos resueltos de forma no satisfactoria"
        },
        "consultas_finalizadas_insatisfactoriamente":{
            "count":0,
            "description":"Total de consultas resueltas de forma no satisfactoria"
        },
        "reclamos_finalizados":{
            "count":0,
            "description":"Total de reclamos resueltos independientemente del resultado"
        },
        "consultas_finalizadas":{
            "count":0,
            "description":"Total de consultas resueltas independientemente del resultado"
        },
        "total_solicitudes_finalizadas":{
            "count":0,
            "description":"Total de consultas y reclamos resueltos independientemente del resultado"
        },
        "total_solicitudes_en_gestion":{
            "count":0,
            "description":"Total de consultas y reclamos actualmente en gestion"
        },
        "total_solicitudes_devueltas":{
            "count":0,
            "description":"Total de consultas y reclamos devueltos"
        },
        "total_solicitudes_enviadas":{
            "count":0,
            "description":"Total de consultas y reclamos enviados"
        },
        "total_me_gusta":{
            "count":0,
            "description":"Total de llamados a los que se les ha dado me gusta"
        },
        "total_logins":{
            "count":0,
            "description":"Total de Inicios de Sesión"
        },
        "total_usuarios":{
            "count":0,
            "description":"Total de Usuarios Registrados en el Sistema"
        }
     };


  
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
            where r.estado = '1'
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
            where c.estado = '1'
            ),
            
            pre_requests as (
            select * from join_task_claims union
            select * from join_task_questions
            ),
            requests as (
                select r.* from pre_requests r
                
            ),
            
            reclamos_en_gestion as
            (select count(*) as total from requests where tipo= 'RECLAMO' and tarea_estado not like '%RESUELTO%' and tarea_encargado not in ('Usuario')),
            
            consultas_en_gestion as
            (select count(*) as total from requests where tipo= 'CONSULTA' and tarea_estado not like '%RESUELTO%' and tarea_encargado not in ('Usuario')),
            
            reclamos_enviados as
            (select count(*) as total from requests where tipo= 'RECLAMO'),
            
            consultas_enviadas as
            (select count(*) as total from requests where tipo= 'CONSULTA'),
            
            reclamos_devueltos as
            (select count(*) as total from requests where tarea_estado like '%DEVUELTO%' and tipo= 'RECLAMO'),
            
            consultas_devueltas as
            (select count(*) as total from requests where tarea_estado like '%DEVUELTO%' and tipo= 'CONSULTA'),
            
            reclamos_finalizados_insatisfactoriamente as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO_INSATISFACTRIAMENTE%' and tipo= 'RECLAMO'),
            
            consultas_finalizadas_insatisfactoriamente as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO_SIN_RESPUESTA%' and tipo= 'CONSULTA'),
            
            reclamos_finalizados_satisfactoriamente as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO_SATISFACTORIAMENTE%' and tipo= 'RECLAMO'),
            
            consultas_finalizadas_satisfactoriamente as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO_RESPUESTA%' and tipo= 'CONSULTA'),
            
			reclamos_finalizados as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO%' and tipo= 'RECLAMO'),
            
            consultas_finalizadas as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO%' and tipo= 'CONSULTA'),
            
            finalizados as
            (select count(*) as total from requests where tarea_estado like '%RESUELTO%'),
            
            pendientes as
            (select count(*) as total from requests where tarea_estado not like '%RESUELTO%' and tarea_encargado not in ('Usuario') ),
            
            devueltos as
            (select count(*) as total from requests where tarea_estado like '%DEVUELTO%'),
            
            calculados as (
            select
            (select total from reclamos_en_gestion) as reclamos_en_gestion,
            (select total from consultas_en_gestion) as consultas_en_gestion,
            (select total from reclamos_enviados) as reclamos_enviados,
            (select total from consultas_enviadas) as consultas_enviadas,
            (select total from reclamos_devueltos) as reclamos_devueltos,
            (select total from consultas_devueltas) as consultas_devueltas,
            
            (select total from reclamos_finalizados_satisfactoriamente) as reclamos_finalizados_satisfactoriamente,
            (select total from consultas_finalizadas_satisfactoriamente) as consultas_finalizadas_satisfactoriamente,
            (select total from reclamos_finalizados_insatisfactoriamente) as reclamos_finalizados_insatisfactoriamente,
            (select total from consultas_finalizadas_insatisfactoriamente) as consultas_finalizadas_insatisfactoriamente,
            
            (select total from reclamos_finalizados) as reclamos_finalizados,
            (select total from consultas_finalizadas) as consultas_finalizadas,
            (select total from finalizados) as finalizados,
            (select total from pendientes) as pendientes,
            (select total from devueltos) as devueltos,
            (select  count(*) as total_likes from me_gusta where estado= '1') as likes,
            (select  count(*) as total_logeos from logeos ) as logins,
            (select  count(*) as total_usuarios from usuarios u) as usuarios
            
            )
            
            select 
            c.reclamos_en_gestion,
            c.consultas_en_gestion,
            c.reclamos_enviados,
            c.consultas_enviadas,
            c.consultas_devueltas,
            c.reclamos_devueltos,
            c.reclamos_finalizados_satisfactoriamente,
           c.consultas_finalizadas_satisfactoriamente,
           c.reclamos_finalizados_insatisfactoriamente,
           c.consultas_finalizadas_insatisfactoriamente,
            c.reclamos_finalizados,
           c.consultas_finalizadas,
          c.finalizados as total_solicitudes_finalizadas, 
         c.pendientes as total_solicitudes_en_gestion, 
        c.devueltos as total_solicitudes_devueltas,
        c.likes as total_me_gusta,
        c.logins as total_logins,
        c.usuarios as total_usuarios,
       (c.finalizados+ c.pendientes+ c.devueltos) as total_solicitudes_enviadas  from calculados c;
            
        `,[]);
        await client.end();


        let resultBD=result.rows[0];
        
        for (const property in resultBD) {
            response[property]['count']=resultBD[property];
        }
        }
        catch(e){
  
        return globals.sendResponse( {
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    
  
    return globals.sendResponse(
      response
    );
  };
