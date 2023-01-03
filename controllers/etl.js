const { Pool, Client } = require('pg');
const globals = require('./globals');
var api_url='https://www.contrataciones.gov.py/datos/api/v3/doc';
var queriesDir=`${globals.getString(process.env.LAMBDA_TASK_ROOT )?process.env.LAMBDA_TASK_ROOT:".."}/queries/`;
//var queriesDir=`${__dirname}/queries/`;
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

  

module.exports.ETLValidProcesses =async (event) => {
    let insertions=[];
    let etlTransaction = Sentry.startTransaction({
        name: "Proceso de ETL de Procesos Vigentes",
        op: 'etl_process'
      });
    let files=fs.readdirSync(queriesDir).filter((file)=>{return /\.sql$/g.test(file);}).sort();

    let firstFile=files[0];
    if(firstFile){
        let result = await executeQuery(fs.readFileSync(`${queriesDir}${firstFile}`,{encoding:'utf8', flag:'r'}),firstFile);
        if(result.error){
            etlTransaction.finish();
            return result;
        }
        insertions=await getDNCPValidProcesses();
    }
    
    let restOfFiles=files.slice(1);
    for(let file of restOfFiles){
        let result  = await executeQuery(fs.readFileSync(`${queriesDir}${file}`,{encoding:'utf8', flag:'r'}),file);
        if(result.error){
            etlTransaction.finish();
            return result;
        }
    }
   etlTransaction.finish();
   return insertions;
}
async function getDNCPValidProcesses(){
    /*let transaction = Sentry.getCurrentHub()
    .getScope()
    .getTransaction();*/
    let insertions=[];
    let access_token='';
    let filters={
    
    };
    let pagination={
        "total_items": 0,
        "total_pages": 0,
        "current_page": 1,
        "items_per_page": 10,
        "total_in_page": 0
    };

   
    let fecha_desde=`${globals.getDateText(new Date(),'YEAR-MONTH-DAY')}`;

    let fullRecords=[];
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
        Sentry.captureException(e);
    }
    
    try{
        //let getProcessesTransaction = transaction?.startChild({ op:"get_processes_group",description: `Obtener lote de procesos de ${pagination.items_per_page} : #${1}` }); // This function returns a Span
    
      
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
              page:pagination.current_page,
              fecha_desde:fecha_desde,
              tipo_fecha:"entrega_ofertas",
              items_per_page:pagination.items_per_page,
              /*"tender.statusDetails":"En Convocatoria (Abierta)",*/
              order:"tender.tenderPeriod.endDate desc"
            }
          }
          }
        );
        pagination=response_processes.data.pagination;
        let fullRecordsPromise=response_processes.data.records.map((record)=>{
            return {ocid:record.ocid,access_token:access_token};
           }).map(getProcessFullData);
        //fullRecords=[...fullRecords,...await Promise.all(fullRecordsPromise)];
        //getProcessesTransaction?.finish();


        //let insertProcessesTransaction = transaction?.startChild({ op:"insert_processes_group",description: `Insertar lote de procesos de ${pagination.items_per_page} : #${1}` }); 
    
        await insertProcessesGroup([...await Promise.all(fullRecordsPromise)],insertions);
        //insertProcessesTransaction?.finish();

       
        for(let i=(pagination.current_page+1);i<=pagination.total_pages;i++){
            //let getProcessesTransaction = transaction?.startChild({ op:"get_processes_group",description: `Obtener lote de procesos de ${pagination.items_per_page} : #${i}` });
    
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
                    page:i,
                    fecha_desde:fecha_desde,
                    tipo_fecha:"entrega_ofertas",
                    items_per_page:pagination.items_per_page,
                    /*"tender.statusDetails":"En Convocatoria (Abierta)",*/
                    order:"tender.tenderPeriod.endDate desc"
                  }
                }
                }
              );
                pagination=response_processes.data.pagination;
                let fullRecordsPromise=response_processes.data.records.map((record)=>{
                return {ocid:record.ocid,access_token:access_token};
                }).map(getProcessFullData);
            //getProcessesTransaction?.finish();
            //let insertProcessesTransaction = transaction?.startChild({ op:"insert_processes_group",description: `Insertar lote de procesos de ${pagination.items_per_page} : #${i}` }); 
    
            await insertProcessesGroup([...await Promise.all(fullRecordsPromise)],insertions);
            //insertProcessesTransaction?.finish();
        }
    
 
        
      }
      catch(e){
        Sentry.captureException(e);
          return {
            message: e.message,
            error:true
            }
      }
      
      return insertions
      

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
            Sentry.captureException(e);
          return {
            error:true,
            message: e.message,
            data:e
          };          
        }
      return response;
}

async function insertProcessData(data){
    
    let result={};
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`INSERT INTO ocds.data (data, release_id, ocid)
          VALUES ($1, $2, $3)
          ON CONFLICT ON CONSTRAINT ocid_uniq
          DO UPDATE SET release_id=$2, data=$1, id=nextval('ocds.data_id_seq')
          WHERE data.release_id <> $2
          RETURNING id;`,[data,data.id,data.ocid]);
        await client.end();

        if(result?.rows[0]?.id){
            result={inserted:true,id:result?.rows[0]?.id};
        }
        }
        catch(e){
        
        result={
            message: e.message,
            error:true
        }
        Sentry.captureException(e);
      } 
    

    return result;
  };

async function insertProcessesGroup(fullRecords,insertions){
    for( let compiledRelease of fullRecords){
        if(compiledRelease.ocid){
            let insertResult=await insertProcessData(compiledRelease);
            insertions.push( {
                ocid:compiledRelease.ocid,
                result:insertResult
            });
        }else{
            insertions.push( {
                error:true,
                data:compiledRelease
            });
        }
      }
}


async function executeQuery(query,fileName,params){
    /*let transaction = Sentry.getCurrentHub()
    .getScope()
    .getTransaction();
    */
    //const childTransaction = transaction?.startChild({ op:"query_file_execution",description: `Ejecución de query de ETL: ${fileName}` }); // This function returns a Span
    
    let result={};
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(query,(params?params:[]));
        await client.end();
        }
        catch(e){
        result={
            message: e.message,
            error:true,
            query:query
        }
        Sentry.captureException(e);
    } finally {
        //childTransaction?.finish();
    }
    
    return result;
  };