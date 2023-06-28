const { Pool, Client } = require('pg');
const globals = require('./globals');
var api_url='https://www.contrataciones.gov.py/datos/api/v3/doc';
const axios = require('axios');
const {getUserData} = require('./users');

module.exports.addLike =async (event) => {
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

      let checkParams=globals.validateParams(["call","ocid","status","title"],payload);
      if(checkParams.error){
        return globals.sendResponse({
          message: checkParams.message,
          error:true,
          input:event
          },404);
      }
      if(!globals.validateString(payload.call)){
        return globals.sendResponse({
            message: "Llamado no enviado",
            error:true,
            input:event
            },404);
      }
      if(!globals.validateString(payload.ocid)){
        return globals.sendResponse({
            message: "OCID no enviado",
            error:true,
            input:event
            },404);
      }
      if(![1,0].includes(payload.status)){
        return globals.sendResponse({
            message: "LIKE no enviado",
            error:true,
            input:event
            },404);
      }
      if(!globals.validateString(payload.title)){
        return globals.sendResponse({
            message: "Título no enviado",
            error:true,
            input:event
            },404);
      }

      let fromValues= {
        "claim":"RECLAMO",
        "question":"CONSULTA",
        "opportunity":"OPORTUNIDAD",
        "search":"BUSQUEDA"
      }

      consulta={
        usuario:payload.user,
        llamado:payload.call,
        ocid:payload.ocid, 
        estado:payload.status,
        titulo:payload.title,
        origen:(['question','claim','opportunity','search'].includes(payload.from)?fromValues[payload.from]:null)
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
        result = await client.query(`INSERT INTO public.me_gusta
        (llamado, ocid, usuario, estado,titulo,origen, fecha_modificacion, fecha_creacion)
        VALUES($1,$2,$3,$4,$5,$6,NULL,NOW())
        ON CONFLICT ON CONSTRAINT usuario_llamado_me_gusta
        DO UPDATE SET ocid=$2, estado=$4, fecha_modificacion=NOW()
        RETURNING id;`,[consulta.llamado,consulta.ocid,event.user.attributes.id,consulta.estado,consulta.titulo,consulta.origen]);
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

    return globals.sendResponse(result.rows[0]?result.rows[0]:{});
  };


  module.exports.getLike =async (event) => {
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
      if(!globals.validateString(payload.call)){
        return globals.sendResponse({
            message: "Llamado no enviado",
            error:true,
            input:event
            },404);
      }

      
      consulta={
        usuario:payload.user,
        llamado:payload.call
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
        result = await client.query(`SELECT * FROM public.me_gusta WHERE usuario = $1 AND llamado = $2;`,[event.user.attributes.id,consulta.llamado]);
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

    return globals.sendResponse(result.rows[0]?result.rows[0]:{});
  };

  module.exports.getMyLikes =async (event) => {
    let payload={};
    let consulta={};
    let pagination={};
    let access_token= '';
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
        pageSize:globals.getNumber(payload.pageSize)?globals.getNumber(payload.pageSize):6,
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
          filterArray.push({query:`AND (lower(trim(titulo)) LIKE XVARIABLEX OR lower(trim(llamado)) LIKE XVARIABLEX) `,variable:`%${globals.getString(payload[filter].trim().toLowerCase()) }%`});
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

    let fullResult={
    records:[

    ],
    "pagination": {    }
    }
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`      
        SELECT
      (SELECT COUNT(*) 
       FROM public.me_gusta
       WHERE usuario = $1
       AND estado = '1'
       ${filterArray.map((filter)=>{
        return filter.query;
      }).join('\n')}
      ) as total, 
      (SELECT json_agg(t.*) FROM (
          SELECT * FROM public.me_gusta
          WHERE usuario = $1
          AND estado = '1'
          ${filterArray.map((filter)=>{
            return filter.query;
          }).join('\n')}
          ORDER BY fecha_creacion DESC
          LIMIT $2
          OFFSET $3
      ) AS t) AS data;
        `,[...[event.user.attributes.id,pagination.pageSize,(pagination.pageSize*(pagination.page-1))],
        ...filterArray.map((filter)=>{
          return filter.variable;
        })]
    );
        await client.end();

        

        }
        catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
      } 
      fullResult['pagination']={
        "total_items": globals.getNumber(result.rows[0].total),
        "total_pages": Math.ceil(globals.getNumber(result.rows[0].total)/pagination.pageSize),
        "current_page": pagination.page,
        "items_per_page": pagination.pageSize,
        "total_in_page": (result.rows[0].data?result.rows[0].data.length:0)
    }
    //fullResult['records']=
      if(result.rows[0].data&&result.rows[0].data.length){
        try{
            let response_access_token= await axios(
             {
               method: 'post',
               url: `${api_url}/oauth/token`,
               headers: { 
                 'Content-Type': 'application/json'
               },
               data:{
                 "request_token": process.env.REQUEST_TOKEN_API_DNCP
               }
             }
            );
           access_token= response_access_token.data.access_token;
       }
       catch(e){
           //e.message;
           return globals.sendResponse({
               message: e.message,
               error:true,
               input:event
             },404);
       }


       let fullRecordsPromise=result.rows[0].data.map((like)=>{
        return {ocid:like.ocid,access_token:access_token};
      }).map(getProcessFullData);
      let fullRecords=await Promise.all(fullRecordsPromise);
      fullResult['records']=fullRecords;
      }
      
    

    return globals.sendResponse(fullResult);
  };


  async function getProcessFullData(data){
    let response={};
      try{
        let response_processes=await axios(
          {
            method: 'get',
            url: `${api_url}/ocds/record/${data.ocid}`,
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `${data.access_token}`
            },
            params: {
            }
          }
        );
  
        response=response_processes.data.records[0].compiledRelease;
        }
        catch(e){
          return {
            error:true,
            message: e.message,
            data:e
          };          
        }
      return response;
  }