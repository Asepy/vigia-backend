const nodemailer = require("nodemailer");

const fs = require('fs');
const globals = require('./globals');
const { Pool, Client } = require('pg');
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
                html: data.html
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