const { Pool, Client } = require('pg');
const globals = require('./globals');
var api_url='https://www.contrataciones.gov.py/datos/api/v3/doc';
const axios = require('axios');
const {getUserData} = require('./users');
exports.getProcessDNCP = async (event) => {
    const payload=JSON.parse(event.body);

    let checkParams=globals.validateParams(["id"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }

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
    const payload=JSON.parse(event.body);
    let checkParams=globals.validateParams(["ocid"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
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
    const payload=JSON.parse(event.body);
    let checkParams=globals.validateParams(["id"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
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
    const payload=JSON.parse(event.body);
    
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
        result = await client.query(`select distinct entidad as entidad  from consultas c union
        (select distinct entidad as entidad from reclamos r)
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