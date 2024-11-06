const { Pool, Client } = require('pg');
const globals = require('./globals');
var api_url='https://www.contrataciones.gov.py/datos/api/v3/doc';
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const GLOBAL = require('../scrapping/global');
axiosRetry(axios, { 
  retries: 10,
  retryDelay: (retryCount) => {
      return retryCount * 250;
  },
  retryCondition: (error) => {
              
      return ([502,503,504,500].includes(error?.response?.status) || 
      GLOBAL.getString(error?.message).includes('ETIMEDOUT')|| 
      GLOBAL.getString(error?.message).includes('ECONNRESET')|| 
      GLOBAL.getString(error?.message).includes('ECONNREFUSED')|| 
      GLOBAL.getString(error?.message).includes('EAI_AGAIN')||
      GLOBAL.getString(error?.message).includes('socket hang up'));
  } 
});

const {getProcessData} = require('../scrapping/scrapping');


const {getUserData} = require('./users');

exports.getProcessDNCP = async (event) => {
    const payload= (event?.body)?JSON.parse(event.body):event;

    let checkParams=globals.validateParams(["id"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
    /*

    try{
      
      const client = new Client();
      await client.connect();
      const result = await client.query(`
    
      SELECT o.data from scrapper.ocds as o 
      WHERE o.llamado = $1
      ORDER BY o.llamado_publicacion DESC
      LIMIT 1

      `,[
          globals.getString(payload.id)
      ]);
      await client.end();
      if(result?.rows?.length){
        return globals.sendResponse(result.rows[0]?.data);
      }

      }
      catch(e){
      } 









    try{
      let process= await getProcessData(payload.id)
      if(process){
        return globals.sendResponse( process)
      }else{
        return globals.sendResponse({
          message: 'no se encontro el llamado en la dncp',
          error:true,
          input:event
        },404);
      }

      
    }catch(e){

      return globals.sendResponse({
        message: e.message,
        error:true,
        input:event
      },404);
    }*/






    let access_token=''
    
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
  
    let ocid='';
    try{
      let response_processes=await axios(
        {
          method: 'get',
          url: `${api_url}/search/processes`,
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `${access_token}`
          },
          params: {
            ocid: `ocds-03ad3f-${payload.id}-`
          }
        }
      );
      ocid=response_processes.data.records[0].ocid;
      }
      catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
          },404);
          
      }
      let response={};
      try{
        let response_ocid=await axios(
          {
            method: 'get',
            url: `${api_url}/ocds/record/${ocid}`,
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `${access_token}`
            },
            params: {
              ocid: `ocds-03ad3f-${payload.id}-`
            }
          }
        );
        response=response_ocid.data.records[0].compiledRelease;
        }
        catch(e){
            return globals.sendResponse({
                message: e.message,
                error:true,
                input:event
              },404);
            
        }
  
    return globals.sendResponse( response);
    
  };
  
exports.getProcessDNCPOCID = async (event) => {
    const payload=(event?.body)?JSON.parse(event.body):event;
    let checkParams=globals.validateParams(["ocid"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }

/*
    try{
      
      const client = new Client();
      await client.connect();
      const result = await client.query(`
    
      SELECT o.data from scrapper.ocds as o 
      WHERE o.ocid = $1
      ORDER BY o.llamado_publicacion DESC
      LIMIT 1

      `,[
          globals.getString(payload.ocid)
      ]);
      await client.end();
      if(result?.rows?.length){
        return globals.sendResponse(result.rows[0]?.data);
      }

      }
      catch(e){
      } 

    try{
      let process= await getProcessData(globals.getString(payload.ocid).replace('ocds-03ad3f-','').split('-')[0])
      if(process){
        return globals.sendResponse(process)
      }else{
        return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
        },404);
      }

      
    }catch(e){

      return globals.sendResponse({
        message: e.message,
        error:true,
        input:event
      },404);
    }*/






    let access_token=''
    
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
      let response={};
      try{
        let response_ocid=await axios(
          {
            method: 'get',
            url: `${api_url}/ocds/record/${payload.ocid}`,
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `${access_token}`
            },
            params: {
              ocid: payload.ocid
            }
          }
        );
        response=response_ocid.data.records[0].compiledRelease;
        }
        catch(e){
            return globals.sendResponse({
                message: e.message,
                error:true,
                input:event
              },404);
            
        }
  
    return globals.sendResponse(response);
  };

exports.checkProcessDNCP = async (event) => {
    const payload=(event?.body)?JSON.parse(event.body):event;
    let checkParams=globals.validateParams(["id"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
/*
    try{
      
      const client = new Client();
      await client.connect();
      const result = await client.query(`
    
      SELECT 1 from scrapper.ocds as o 
      WHERE o.llamado = $1
      ORDER BY o.llamado_publicacion DESC
      LIMIT 1
      `,[
          globals.getString(payload.id)
      ]);
      await client.end();
      if(result?.rows?.length){
        return globals.sendResponse( {ok:1, type:"local"});
      }

      }
      catch(e){
      } 









    try{
      let process= await getProcessData(payload.id,true);
      if(process){
        return globals.sendResponse( {ok:1, type:"dncp"})
      }else{
        return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
        },404);
      }

      
    }catch(e){

      return globals.sendResponse({
        message: e.message,
        error:true,
        input:event
      },404);
    }



    return;*/
    let access_token=''
    
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
  
    let response={};
    try{
      let response_processes=await axios(
        {
          method: 'get',
          url: `${api_url}/search/processes`,
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `${access_token}`
          },
          params: {
            ocid: `ocds-03ad3f-${payload.id}-`
          }
        }
      );

      response=response_processes.data.records[0];
      }
      catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
          },404);
          
      }

    return globals.sendResponse( response);
    
  };

  exports.getProcuringEntities = async (event) => {
    const payload=JSON.parse(event.body);
    
    let access_token=''
    
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
  
    let response={};
    try{
      let response_processes=await axios(
        {
          method: 'get',
          url: `${api_url}/search/procuringEntities`,
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `${access_token}`
          },
          params: {
            items_per_page: 2000
          }
        }
      );

      response=response_processes.data;
      }
      catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
          },404);
          
      }

    return globals.sendResponse( response);
    
  };

  exports.searchProcessDNCP = async (event) => {
    const payload=(event?.body)?JSON.parse(event.body):event;
    /*let filterArray=[];
  
    for (const filter of Object.keys(payload)){
      if(globals.validateString(payload[filter])){
        switch(filter){
          case 'search':
            filterArray.push({query:`AND ((lower(o.titulo) LIKE lower(XVARIABLEX)) OR (lower(o.llamado) LIKE lower(XVARIABLEX)) ) `,variable:`%${payload[filter]}%`});
            break;
          case 'entity':
            filterArray.push({query:`AND (lower(o.convocante) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'entity_id':
            filterArray.push({query:`AND (lower(o.convocante_id) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'category':
            filterArray.push({query:`AND (lower(o.categoria_detalle) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'method':
            filterArray.push({query:`AND (lower(o.procedimiento) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          default:
        }
      }
    }
    filterArray=filterArray.map(
      (filter,index)=>{
        return {query:filter.query.replace(/XVARIABLEX/g,`$${(index+3)}`), variable : filter.variable};
      }
    )

    pagination={
      page:globals.getNumber(payload.page)?globals.getNumber(payload.page):1,
      pageSize:globals.getNumber(payload.pageSize)?globals.getNumber(payload.pageSize):5,
    }

   

    try{
      
      const client = new Client();
      await client.connect();
      result = await client.query(`
    
      SELECT o.data from scrapper.ocds as o 
      WHERE TRUE
      ${filterArray.map((filter)=>{
        return filter.query;
      }).join('\n')}
      ORDER BY o.llamado_fecha_fin DESC
        LIMIT $1
        OFFSET $2;

      `,[
          ...[
            pagination.pageSize,
            (pagination.pageSize*(pagination.page-1)),
          ],
          ...filterArray.map((filter)=>{
            return filter.variable;
          })
    ]);
    total_result = await client.query(`
      SELECT COUNT(*) as total,$1,$2 from scrapper.ocds as o WHERE TRUE
      ${filterArray.map((filter)=>{
        return filter.query;
      }).join('\n')};`,[
          ...[
            pagination.pageSize,
            (pagination.pageSize*(pagination.page-1)),
          ],
          ...filterArray.map((filter)=>{
            return filter.variable;
          })
        ]);
      await client.end();
      if(!result?.rows?.length){
        return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
          },404);
      }
      return globals.sendResponse(
        {...{records:result.rows.map((data)=>{
          return data?.data;
        })},

        ...{
          pagination:{
            total_items: globals.getNumber(total_result.rows[0]?.total), total_pages: Math.ceil(globals.getNumber(total_result.rows[0]?.total)/pagination.pageSize), current_page: pagination.page, items_per_page: pagination.pageSize, total_in_page: pagination.pageSize
          }
        }
        }
      );

      }
      catch(e){
        return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
          },404);
      } 

    return */
    let access_token='';
    let filters={

    };
    
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
  
    let response={};

  for (let filter of Object.keys(payload)){
    if(globals.validateString(payload[filter])){
      switch(filter){
        case 'search':
          filters["tender.title"]=payload[filter];
          break;
        case 'entity':
          filters["tender.procuringEntity.name"]=payload[filter];
          break;
        case 'category':
          filters["tender.mainProcurementCategoryDetails"]=payload[filter];
          break;
        case 'method':
          filters["tender.procurementMethodDetails"]=payload[filter];
          break;

          
        default:
          break;
      }
    }
  }
    try{
      let fullRecords=[];
      let response_processes=await axios(
        {
          method: 'get',
          url: `${api_url}/search/processes`,
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `${access_token}`
          },
          params:{
          ...filters,
          ...{
            page:(globals.getNumber(payload.page) ?globals.getNumber(payload.page):1),
            /*fecha_desde:`${((new Date()).getFullYear() - 1)}-01-01`,
            tipo_fecha:"entrega_ofertas",*/
            items_per_page:5,
            "tender.statusDetails":"En Convocatoria (Abierta)",
            order:"tender.tenderPeriod.endDate desc"
          }
        }
        }
      );

      response=response_processes.data;

      let fullRecordsPromise=response_processes.data.records.map((record)=>{
        return {ocid:record.ocid,access_token:access_token};
      }).map(getProcessFullData);
      
      fullRecords=await Promise.all(fullRecordsPromise);
 


      response.records=fullRecords;

      }
      catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event,
            filters:filters
          },404);
          
      }

    return globals.sendResponse( response);
    
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


exports.getPartyProcessesDNCP = async (event) => {
  const payload=JSON.parse(event.body);
  let checkParams=globals.validateParams(["ruc"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
  let access_token='';
  let filters={
    "parties.id":payload.ruc
  };


  let itemsRecords=[];
  let procurementMethodDetailsArray=[];
  let mainProcurementCategoryDetailsArray=[];
  let mainProcurementCategoryArray=[];
  let UNSPSCArray=[];
  let catalogoNivel5DNCPArray=[];
  let partyData={};
  let catalogoNivel5DNCPDescriptionArray=[];

  access_token= await getAccesToken();
  if(!globals.validateString(access_token)){
    return globals.sendResponse({
      message: "No se pudo obtener el access token",
      error:true
    },404);
  }

  let response={};

  let fullRecords=[];
  try{
    
    let response_processes=await axios(
      {
        method: 'get',
        url: `${api_url}/search/processes`,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `${access_token}`
        },
        params:{
        ...filters,
        ...{
          page:1,
          /*fecha_desde:`${globals.getDateText(new Date(),'YEAR-MONTH-DAY')}`,
          tipo_fecha:"entrega_ofertas",*/
          items_per_page:50,
          /*"tender.statusDetails":"En Convocatoria (Abierta)",*/
          order:"tender.tenderPeriod.endDate desc"
        }
      }
      }
    );

    response=response_processes.data;

    let fullRecordsPromise=response_processes.data.records.map((record)=>{
      return {ocid:record.ocid,access_token:access_token};
    }).map(getProcessFullData);
    

    fullRecords=await Promise.all(fullRecordsPromise);
    response.records=fullRecords;


    
   
    for( let record of fullRecords){
      if(
        record?.tender?.items
      ){
        itemsRecords=[...itemsRecords,...record?.tender?.items]
      }

      if(
        record?.awards?.items
      ){
        itemsRecords=[...itemsRecords,...record?.awards?.items]
      }

      if(
        record?.tender?.procurementMethodDetails
      ){
        procurementMethodDetailsArray.push(record?.tender?.procurementMethodDetails)
      }

      if(
        record?.tender?.mainProcurementCategoryDetails
      ){
        mainProcurementCategoryDetailsArray.push(record?.tender?.mainProcurementCategoryDetails)
      }

      if(
        record?.tender?.mainProcurementCategory
      ){
        mainProcurementCategoryArray.push(record?.tender?.mainProcurementCategory)
      }

      if((!partyData.id)&&record?.parties){
     
          let partyRecord=record.parties.filter((party)=>{
            return party.id.includes(payload.ruc);
          })[0];
          if(partyRecord){
            partyData=partyRecord.identifier;
          }
        
        
      }


    }


    for( let item of itemsRecords){
      if((item?.classification?.id) && item.classification.scheme=="catalogoNivel5DNCP"){
        catalogoNivel5DNCPArray.push(item?.classification?.id)
        catalogoNivel5DNCPDescriptionArray.push(item?.classification?.description);
      }else if((item?.classification?.id) && item.classification.scheme=="UNSPSC"){
        UNSPSCArray.push(item?.classification?.id)
      }

      if((item?.additionalClassifications)){
        for(let additionalClassification of item.additionalClassifications){
          if(additionalClassification.scheme=="catalogoNivel5DNCP"){
            catalogoNivel5DNCPDescriptionArray.push(additionalClassification.description);
            catalogoNivel5DNCPArray.push(additionalClassification.id)
          }else if(additionalClassification.scheme=="UNSPSC"){
            UNSPSCArray.push(additionalClassification.id)
          }
        }
      }


    }
    



    



    }
    catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event,
          filters:filters,
          test:`${globals.getDateText(new Date(),'YEAR-MONTH-DAY')}`
        },404);
        
    }

  return globals.sendResponse({
    party:partyData,
    LVL1Array:[...new Set(UNSPSCArray.map((data)=>{
      return data.substring(0, 2)+"000000";
    }))],
    LVL4Array:[...new Set(UNSPSCArray)],
    LVL5Array:[...new Set(catalogoNivel5DNCPArray)],
    itemsDescriptions:[...new Set(catalogoNivel5DNCPDescriptionArray)],
    procurementMethodDetailsArray:[...new Set(procurementMethodDetailsArray)],
    mainProcurementCategoryDetailsArray:[...new Set(mainProcurementCategoryDetailsArray)],
    mainProcurementCategoryArray:[...new Set(mainProcurementCategoryArray)]
  });
  
};






async function getAccesToken(){
  let access_token=''
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
    access_token=response_access_token.data.access_token;
  }
  catch(e){
   
   //e.message;
   /*return globals.sendResponse({
       message: e.message,
       error:true,
       input:event
     },404);*/
  }
  return access_token;
}




exports.getMyProcesses = async (event) => {
  let payload={};
  let consulta={};
  
  let access_token='';
  let filters={

  };
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
  let ruc=''
  if(result?.rows[0]?.ruc){
    ruc=result?.rows[0]?.ruc
  }

  if(!globals.validateString(ruc)){
    return globals.sendResponse({
      message: "Aun no haz vinculado un RUC a tu cuenta",
      error:true
      },404);
  }



  switch(payload.type){
    case "awards":
      filters["awards.suppliers.id"]=ruc;
      break;
    default:
      filters["tender.tenderers.id"]=ruc;
      filters["fecha_desde"]=`${globals.getDateText(new Date(),'YEAR-MONTH-DAY')}`;
      filters["tipo_fecha"]="entrega_ofertas"
      break;
  }
  access_token= await getAccesToken();
  if(!globals.validateString(access_token)){
    return globals.sendResponse({
      message: "No se pudo obtener el access token",
      error:true
    },404);
  }

  let response={};

for (let filter of Object.keys(payload)){
  if(globals.validateString(payload[filter])){
    switch(filter){
      case 'search':
        filters["tender.title"]=payload[filter];
        break;

        
      default:
        break;
    }
  }
}
  try{
    let fullRecords=[];
    let response_processes=await axios(
      {
        method: 'get',
        url: `${api_url}/search/processes`,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `${access_token}`
        },
        params:{
        ...filters,
        ...{
          page:(globals.getNumber(payload.page) ?globals.getNumber(payload.page):1),
          /*fecha_desde:`${((new Date()).getFullYear() - 1)}-01-01`,
          tipo_fecha:"entrega_ofertas",*/
          items_per_page:6,
          //"tender.statusDetails":"En Convocatoria (Abierta)",
          order:"tender.tenderPeriod.endDate desc"
        }
      }
      }
    );

    response=response_processes.data;

    let fullRecordsPromise=response_processes.data.records.map((record)=>{
      return {ocid:record.ocid,access_token:access_token};
    }).map(getProcessFullData);
    
    fullRecords=await Promise.all(fullRecordsPromise);



    response.records=fullRecords;

    }
    catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event,
          filters:filters
        },404);
        
    }

  return globals.sendResponse( response);
  
};

exports.getProcuringEntitiesRequests = async (event) => {
  const payload=JSON.parse(event.body);
  
  let access_token=''
  
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

  let response={};
  try{
    let response_processes=await axios(
      {
        method: 'get',
        url: `${api_url}/search/procuringEntities`,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `${access_token}`
        },
        params: {
          items_per_page: 2000
        }
      }
    );

    response=response_processes.data;
    }
    catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
        },404);
        
    }


    result={};
    entities=[];
    try{
        
        const client = new Client();
        await client.connect();
        result = await client.query(`select distinct entidad as entidad  from consultas c where c.estado = '1' union
        (select distinct entidad as entidad from reclamos r where r.estado = '1')
        order by entidad asc;`,[]);
        await client.end();
        let IDs=result.rows.map((data)=>{return data.entidad;})
        entities= response.list.filter((entity)=>{
          return IDs.includes(entity.id); 
        });
      }catch(e){
        return globals.sendResponse({
          message: e.message,
          error:true,
          input:event},404);
      }
    
      

  return globals.sendResponse(entities);
  
};

module.exports.saveSearch =async (event) => {
  let payload={};

  let result={};
  
  try{
    payload=JSON.parse(event.body);
  }catch(e){
    return globals.sendResponse( {
      message: e.message,
      error:true,
      input:event
    },404);
  } 
    if((globals.getNumber(payload.page) ?globals.getNumber(payload.page):1) !==1){
      return globals.sendResponse(
        {id:0}
      );
    }

    try{
      event['user']=await getUserData(event);
      const client = new Client();
      await client.connect();
      result = await client.query(`
      INSERT INTO public.busquedas
      (busqueda, categoria, contratante, procedimiento, usuario, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, $4, $5, 1, NULL, NOW()) RETURNING id;

      `,[
          ...[globals.validateString(payload['search'])?payload['search']:null,
            globals.validateString(payload['category'])?payload['category']:null,
            globals.validateString(payload['entity'])?payload['entity']:null,
            globals.validateString(payload['method'])?payload['method']:null,
            ((event?.user?.attributes?.id)?(event?.user?.attributes?.id):null)
          ]
       
    ]);
      await client.end();
      return globals.sendResponse(
        result.rows[0]
      );

      }
      catch(e){
        return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
          },404);
      } 

}

module.exports.saveProcessView =async (event) => {
  let payload={};

  let result={};
  
  try{
    payload=JSON.parse(event.body);
  }catch(e){
    return globals.sendResponse( {
      message: e.message,
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
    let consulta={
        llamado:payload.call,
        origen:payload.from,
        ocid:payload.ocid, 
        titulo:payload.title,
        interaccion:(globals.getNumber(payload.click)==1? true:false)
    };

    if(
    (!['question','claim','opportunity','search'].includes(consulta.origen))
    ||
    (!(globals.validateString(consulta.llamado)&&globals.validateString(consulta.ocid)&& globals.validateString(consulta.titulo)))
    ||
    (globals.getNumber(consulta.llamado)==0)
    ){
      return globals.sendResponse(
        {id:0}
      );
    }
    consulta.origen = fromValues[consulta.origen];

    try{
      event['user']=await getUserData(event);
      const client = new Client();
      await client.connect();
      result = await client.query(`
      INSERT INTO public.visualizacion_ofertas
      (llamado, ocid, origen, interaccion, titulo, usuario, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, $4, $5, $6, 1,NULL, NOW()) RETURNING id;

      `,[
          ...[consulta.llamado,
            consulta.ocid,
            consulta.origen,
            consulta.interaccion,
            consulta.titulo,
            ((event?.user?.attributes?.id)?(event?.user?.attributes?.id):null)
          ]
       
    ]);
      await client.end();
      return globals.sendResponse(
        result.rows[0]
      );

      }
      catch(e){
        return globals.sendResponse( {
          message: e.message,
          error:true,
          input:event
          },404);
      } 

}


exports.checkProcessMIPYME = async (event) => {
  const payload=JSON.parse(event.body);
  let checkParams=globals.validateParams(["tenderId"],payload);
  if(checkParams.error){
    return globals.sendResponse({
      message: checkParams.message,
      error:true,
      input:event
      },404);
  }
  

  let response={
    MIPYME:false
  };
  try{
       let request= await axios(
        {
          method: 'get',
          url: `https://www.contrataciones.gov.py/licitaciones/convocatoria/${payload.tenderId}.html`,
          headers: { 
            'Content-Type': 'text/html'
          }
        }
       );

       if(request.status==200 &&request.data && /Accesible para MIPYMES/gi.test(request.data)){
        response={
          MIPYME:true
        }
       }
  }
  catch(e){
      //e.message;
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
        },404);
  }
    

  return globals.sendResponse(response);
};

function getProcessScrapper(){

}


