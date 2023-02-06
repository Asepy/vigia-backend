const nodemailer = require("nodemailer");

const fs = require('fs');
const globals = require('./globals');
const { Pool, Client } = require('pg');
const { parseUrl } = require("@sentry/utils");
var templatesDir=`${globals.getString(process.env.LAMBDA_TASK_ROOT )?process.env.LAMBDA_TASK_ROOT:".."}/mail_templates/`;

exports.sendMail=async (data)=>{
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // true for 465, false for other ports
        auth:{
          
                user: process.env.SMTP_USER, 
                pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
      });
      try{
        let response=await transporter.sendMail(
            {
                from: `"VigiA" <${process.env.SMTP_FROM_EMAIL}>`,
                to: data.to, 
                subject: data.subject, 
                html: data.html,
                cc:data.cc?data.cc:undefined,
                bcc:data.cco?data.cco:undefined
            }
          )
          console.log(response)
      }
      catch(e){
        console.log(e)
      }
  }
exports.sendStatusTask=async (data)=>{

    let mailContent=fs.readFileSync(`${templatesDir}${'status_change_inline.html'}`,{encoding:'utf8', flag:'r'});
    for (let variable of Object.keys(data)){
        let reg=new RegExp(`{${variable}}`, "g");
        mailContent=mailContent.replace(reg,data[variable]);
    }
    
    await exports.sendMail({
        to:data.to,
        subject:data.subject,
        html:mailContent
    });
  }


  exports.sendStatusTaskMail=async (data)=>{
    let result={};
    let mail_params={};
    try{
      const client = new Client();
      await client.connect();
      let query="";
      switch(data.type){
        case 'claim':
          query=`
      select r.*,
    --b.fecha_visualizacion as tarea_fecha_visualizacion, 
    b.fecha_creacion as tarea_fecha_asignacion,
    t.nombre as tarea_estado,
    t.descripcion as tarea_descripcion,
    --,t.grupo as grupo_tarea,
    --t.encargado as tarea_encargado,
    b.justificacion as justificacion
    from reclamos r
        inner join bitacora_reclamos_estados b on b.id_reclamo::bigint = r.id
        inner join (
        select bse.id_reclamo, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_reclamos_estados bse
        group by bse.id_reclamo
        ) bm
        on bm.fecha_creacion = b.fecha_creacion and bm.id_reclamo = b.id_reclamo
        inner join tareas t on b.tarea=t.nombre
          where 
        r.enlace = $1;`
          break;
        default:
          query=`
      select c.*,
    --b.fecha_visualizacion as tarea_fecha_visualizacion, 
    b.fecha_creacion as tarea_fecha_asignacion,
    t.nombre as tarea_estado,
    t.descripcion as tarea_descripcion,
    --,t.grupo as grupo_tarea,
    --t.encargado as tarea_encargado,
    b.justificacion as justificacion
    from consultas c
        inner join bitacora_consultas_estados b on b.id_consulta::bigint = c.id
        inner join (
        select bse.id_consulta, MAX(bse.fecha_creacion) as  fecha_creacion from bitacora_consultas_estados bse
        group by bse.id_consulta
        ) bm
        on bm.fecha_creacion = b.fecha_creacion and bm.id_consulta = b.id_consulta
        inner join tareas t on b.tarea=t.nombre
          where 
      c.enlace = $1;`
          
          break;
      }
      
      result = await client.query(query,[data.link]);
      if(result?.rows[0]?.id){
        let info=result?.rows[0];
        switch(data.type){
          case 'claim':
            mail_params={
              TYPE:"reclamo",
              STATUS:info.tarea_descripcion,
              JUSTIFY:globals.getString(info.justificacion).trim() ,
              LINK:`${process.env.FRONTEND_URL}/claims/claim/?id=${info.enlace}`,
              LOGO:`${process.env.FRONTEND_URL}/images/logos/logo_mail.png`,
              subject:"Tu reclamo ha cambiado de estado.",
              to:globals.getString(info.correo).trim()
              }
          break;
          default:
            mail_params={
              TYPE:"consulta",
              STATUS:info.tarea_descripcion,
              JUSTIFY:globals.getString(info.justificacion).trim() ,
              LINK:`${process.env.FRONTEND_URL}/questions/question/?id=${info.enlace}`,
              LOGO:`${process.env.FRONTEND_URL}/images/logos/logo_mail.png`,
              subject:"Tu consulta ha cambiado de estado.",
              to:globals.getString(info.correo).trim()
              }
            break;
        }
        

          let mailContent=fs.readFileSync(`${templatesDir}${'status_change.html'}`,{encoding:'utf8', flag:'r'});
          for (let variable of Object.keys(mail_params)){
              let reg=new RegExp(`{${variable}}`, "g");
              mailContent=mailContent.replace(reg,mail_params[variable]);
          }
          await exports.sendMail({
            to:mail_params.to,
            subject:mail_params.subject,
            html:mailContent
          });
      }else{
        console.log('no hay id')
      }
    }
    catch(e){
     console.log(e)
    }
    
  }

  exports.sendDirectMail=async (event)=>{
    
     let payload={};
     let consulta={};
     
     let checkParams=globals.validateParams(["call","ocid","to","message","subject","type_request","id","type_mail"],JSON.parse(event.body));
     if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }

     try{
      payload=JSON.parse(event.body);

      
    event['user']=await exports.getUserData(event,['ASEPY','SUPERASEPY','SUPER']);
      if(event?.user?.error){
        return globals.sendResponse({
          message: event?.user?.message,
          error:true
          },404);
      }


      consulta={
        mensaje:payload.message,
        asunto:payload.subject,
        de:process.env.SMTP_FROM_EMAIL,
        para:payload.to,
        cc:payload.cc?payload.cc:null,
        cco:payload.cco?payload.cco:null,
        
        id_reclamo_consulta:payload.id,
        tipo_solicitud:payload.type_request,

        usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,


        
        tipo_correo:payload.type_mail, 
        llamado:payload.call,
        ocid:payload.ocid,
        
        
        estado:1, 
        fecha_modificacion:null, 
        fecha_creacion:''
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

      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // true for 465, false for other ports
        auth:{
          
                user: process.env.SMTP_USER, 
                pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
      });
     
        let response=await transporter.sendMail(
            {
                from: `"VigiA" <${process.env.SMTP_FROM_EMAIL}>`,
                to: consulta.para, 
                subject: consulta.asunto, 
                html: consulta.mensaje,
                cc:consulta.cc,
                bcc:consulta.cco
            }
          );
          console.log(response)
          const client = new Client();
      await client.connect();
      //const res = await client.query//await pool.query
      result = await client.query(`INSERT INTO public.correos
      (mensaje,asunto,de, para, cc, cco, id_reclamo_consulta, tipo_solicitud, usuario, tipo_correo,llamado,ocid, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, $4, $5, $6, $7,$8, $9, $10, $11, NULL, NOW());
       RETURNING id;`,[consulta.mensaje,consulta.asunto,consulta.de,consulta.para, consulta.cc,consulta.cco,consulta.id_reclamo_consulta,consulta.tipo_solicitud,consulta.usuario,
        consulta.tipo_correo,consulta.llamado,consulta.ocid,consulta.estado]);
        
      await client.end();





      }
      catch(e){
        console.log(e)
        return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
        },404);
      }

      
      
      
    
    return globals.sendResponse({
      data:result.rows[0]
    });
     

  }




