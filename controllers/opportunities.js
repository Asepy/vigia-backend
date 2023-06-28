const { Pool, Client } = require('pg');
const globals = require('./globals');
const {getUserData} = require('./users');
module.exports.addOpportunitiesConfig =async (event) => {
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

      let checkParams=globals.validateParams(["categories_lvl1","keywords","formalization","experience"],payload);
      if(checkParams.error){
        return globals.sendResponse({
          message: checkParams.message,
          error:true,
          input:event
          },404);
      }
      
      consulta={
     
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      ruc:globals.validateString(payload.ruc)?payload.ruc:null,
      categorias_nivel1:globals.validateString(payload.categories_lvl1)?payload.categories_lvl1:null,
      categorias_nivel5:globals.validateString(payload.categories_lvl5)?payload.categories_lvl5:null,
      categorias:globals.validateString(payload.categories)?payload.categories:null,
      palabras_clave:globals.validateString(payload.keywords)?payload.keywords:null,
      rango_formalizacion:globals.validateString(payload.formalization)?payload.formalization:null,
      rango_experiencia:globals.validateString(payload.experience)?payload.experience:null,
      estado:1
    };
    }catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
    } 
    
  
  
    
    let result={};
    let result_opportunities={}
      try{
        const client = new Client();
        await client.connect();
        result_opportunities = await client.query(`SELECT * FROM public.oportunidades WHERE usuario = $1;`,[consulta.usuario]);
        let query=""
        if(result_opportunities.rows.length>0){
            query=`UPDATE public.oportunidades
            SET ruc=$1, categorias_nivel1=$2, categorias_nivel5=$3, categorias=$4, palabras_clave=$5, rango_formalizacion=$6, rango_experiencia=$7, estado=$8, fecha_modificacion=NOW()
            WHERE usuario=$9;`
        }else{
            query=`INSERT INTO public.oportunidades
            (ruc, categorias_nivel1, categorias_nivel5, categorias, palabras_clave, rango_formalizacion, rango_experiencia, estado, usuario, fecha_modificacion, fecha_creacion)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NOW()) RETURNING id;`
        }

        
        result = await client.query(query,[consulta.ruc,consulta.categorias_nivel1,consulta.categorias_nivel5,consulta.categorias, consulta.palabras_clave,consulta.rango_formalizacion,consulta.rango_experiencia,consulta.estado,consulta.usuario]);
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
    if(result_opportunities.rows.length>0){
        return globals.sendResponse({id:result_opportunities.rows[0].id,updated:true});
    }else{
        return globals.sendResponse(result.rows[0]);
    }
    
  };

  module.exports.getOpportunitiesConfig =async (event) => {
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
        result = await client.query(`SELECT * FROM public.oportunidades WHERE usuario = $1;`,[consulta.usuario]);
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



  module.exports.getOpportunities =async (event) => {
    //const { Pool, Client } = require('pg');
    
    let payload={};
    let pagination={};
  
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

    let categories_lvl1=[];
    let keywords=[];
    if(payload.categories_lvl1){
        categories_lvl1=payload.categories_lvl1.split("|").map(
            (data)=>{
                return data.slice(0, 2);
            }
            );
    }
    if(payload.keywords){
        keywords=payload.keywords.split("|");
    }

  
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
        with opportunities_all_results as (
            select distinct on (rec.ocid) rec.data
            from ocds.data rec
            inner join ocds.procurement pro on (pro.ocid = rec.ocid)
            inner join ocds.tender_items ten on (ten.ocid = pro.ocid)
            inner join ocds.planning_items plan on (plan.ocid = pro.ocid)
            where pro.tender_title ~* $1
            or ten.description ~* $1
            or ten.classification_description ~* $1
            or plan.description ~* $1
            or plan.classification_description ~* $1
            or ten.classification_id ~ $2
            order by rec.ocid, rec.id desc
          )
       
        SELECT
        (SELECT COUNT(*) 
        FROM  opportunities_all_results
        ) as total,
        (
        select json_agg(opp.data)
        FROM
        (select * from opportunities_all_results
        limit $3
        offset $4) AS opp
        ) AS data;
        `,[
            ...[keywords.map((text)=>{return globals.getTextKeyword(text);}).join("|"),`^(${categories_lvl1.join("|")})`,pagination.pageSize,(pagination.pageSize*(pagination.page-1))]
         
      ]);
        await client.end();
        await saveSearchOpportunities(keywords.map((text)=>{return globals.getTextKeyword(text);}).join("|"),`^(${categories_lvl1.join("|")})`,event);





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


  async function saveSearchOpportunities(categories_lvl1,keywords,event){
    try{
      event['user']=await getUserData(event);
      const client = new Client();
      await client.connect();
      result = await client.query(`
      INSERT INTO public.busquedas_oportunidades
      (categorias_nivel1, palabras_clave, usuario, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, 1, NULL, NOW());

      `,[
          ...[categories_lvl1,keywords,((event?.user?.attributes?.id)?(event?.user?.attributes?.id):null)]
       
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
  }
  