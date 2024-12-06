const { Pool, Client } = require('pg');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const GLOBAL = require('../scrapping/global');

var api_url='https://www.contrataciones.gov.py/datos/api/v3/doc';
const Sentry = require("@sentry/node");
const fs = require('fs-extra');
const moment = require('moment-timezone');

const {parser: jsonlParser} = require('stream-json/jsonl/Parser');
const JSum = require('jsum')

const dateFrom = moment(new Date(), "America/Asuncion").format('YYYY-MM-DD');
//moment.tz(new Date(), "America/Asuncion").format();
const pool = new Pool({
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0,
    max: 50
}
);

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

const filesPath = process.env.LAMBDA_TEMP_DIRECTORY ?? "";

var pagination={
    "total_items": 0,
    "total_pages": 1,
    "current_page": 1,
    "items_per_page": 15,
    "total_in_page": 0
};
var accessToken='';

const executionId = new Date().getTime();

module.exports.ETLLambda = async (event)=>{
    await log(executionId,'Etapa 0 - Inicio de ejecucion del scrapper','0_START','info',null);
    await createLogsTable()
    await createOpportunitiesTable()
    await createOpportunitiesPreTable();
    await getValidProceses();
    await log(executionId,'Etapa 0 - Fin de ejecucion del scrapper','0_START','info',null);
}

async function getValidProceses(){
   
    try{
        let responseAccessToken= await axios(
            {
            timeout: 20000,
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
        accessToken=responseAccessToken.data.access_token;
    }
    catch(e){
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 0 - Obtencion de access token','0_START','error',{error:e?.message});
    }
    

    await log(executionId,'Etapa 0 - Obtencion de access token','0_START','info',{token:accessToken});

    await log(executionId,'Inicio de Etapa 1 - Obtencion ocids','1_OCIDS','info',null);
   
    try{
        fs.ensureDirSync(`${filesPath}etl_lambda`);
        fs.writeFileSync(`${filesPath}etl_lambda/ocids.jsonl`,'');
        for(let i =0; i < pagination.total_pages;i++){
            pagination.current_page = i + 1;
            
            await getProcessGroup(accessToken,pagination);
            
        }

    }catch(e){
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 1 - Obtencion ocids','1_OCIDS','error',{error:e?.message});
    }
    

    await log(executionId,'Fin de Etapa 1 - Obtencion ocids','1_OCIDS','info',null);

    await readOCIDS();

   

}

async function getProcessGroup(){
    try{
        let response=await axios(
            {
              timeout: 20000,
              method: 'get',
              url: `${api_url}/search/processes`,
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `${accessToken}`
              },
              params:{
              ...{
                page:pagination.current_page,
                fecha_desde:dateFrom,
                tipo_fecha:"entrega_ofertas",
                items_per_page:pagination.items_per_page,
                //"tender.statusDetails":"morgan freeman",
                "tender.statusDetails":"En Convocatoria (Abierta)",
                order:"tender.tenderPeriod.endDate desc"
              }
            }
            }
          );

          if(pagination.current_page == 1){
            await log(executionId,'Etapa 1 - Obtencion ocids','1_OCIDS','info',{
                pagination:response.data.pagination
            });
          }

          
         
          
          pagination=response.data.pagination;
          const ocids = response.data.records.map((record)=>{
            return record.ocid;
          });
    
          fs.appendFileSync(`${filesPath}etl_lambda/ocids.jsonl`,JSON.stringify(ocids)+'\n');
    
    }
    catch(e){
        console.dir(e)
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 1 - Obtencion ocids','1_OCIDS','error',{error:e?.message});
    }

      
}

async function readOCIDS(){
    await log(executionId,'Inicio de Etapa 2 - Lectura de ocids','2_READ_OCIDS','info',null);
    try{
        if(!fs.existsSync(`${filesPath}etl_lambda/ocids.jsonl`)){
            await log(executionId,'Error en la Etapa 2 - Lectura de ocids','2_READ_OCIDS','error',{error:'No existe el archivo.jsonl'});
            return;
         }
         
         fs.writeFileSync(`${filesPath}etl_lambda/compiledReleases.jsonl`,'');
    
         const pipeline = fs.createReadStream(`${filesPath}etl_lambda/ocids.jsonl`).pipe(jsonlParser());
         await new Promise(resolve => {
            pipeline.on("data", async (data) => {
                   try{
                    pipeline.pause();
                    //fila data.key
                    await getProcessesFullData(data?.value ?? [])
                    //await sendRecord(data?.value,data.key,executionId);
                   }
                   catch(e){
                    console.dir(e)
                   }
                   
                   pipeline.resume();
                   
                })
                .on("end", () => {
                    resolve(true);
                })
                .on("error", async (e) => {
                    Sentry?.captureException(e);
                });
        });
    }catch(e){
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 2 - Lectura de ocids','2_READ_OCIDS','error',{error:e?.message});
    }

    await log(executionId,'Fin de Etapa 2 - Lectura de ocids','2_READ_OCIDS','info',null);
    
    
    
    await readCompiledReleases();
}

async function readCompiledReleases(){
    await log(executionId,'Inicio de Etapa 5 - Lectura de compiledReleases','5_READ_COMPILED','info',null);
    try{
        if(!fs.existsSync(`${filesPath}etl_lambda/compiledReleases.jsonl`)){
            return;
         }
         
    
         const pipeline = fs.createReadStream(`${filesPath}etl_lambda/compiledReleases.jsonl`).pipe(jsonlParser());
         await new Promise(resolve => {
            pipeline.on("data", async (data) => {
                   try{
                    pipeline.pause();
                    //fila data.key
                    await insertRecord(data?.value)
                    //await sendRecord(data?.value,data.key,executionId);
                   }
                   catch(e){
                    console.dir(e)
                   }
                   
                   pipeline.resume();
                   
                })
                .on("end", () => {
                    resolve(true);
                })
                .on("error", async (e) => {
                    Sentry?.captureException(e);
                });
        });
    }catch(e){
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 5 - Lectura de ocids','5_READ_COMPILED','error',{error:e?.message});
    }
    await log(executionId,'Fin de Etapa 5 - Lectura de compiledReleases','5_READ_COMPILED','info',null);
    
    await insertOpportunities();
}


async function getProcessesFullData(ocids){
    let fullRecordsPromise=ocids.map(getProcessFullData);
    const responses =await Promise.all(fullRecordsPromise);
    try{
        fs.appendFileSync(`${filesPath}etl_lambda/compiledReleases.jsonl`,responses.filter((record)=>{return record?.ocid;}).map((record)=>{return JSON.stringify(record);}).join('\n')+'\n');

    }catch(e){
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 4 - Escritura de  compiled Releases','4_WRITE_COMPILED','error',{error:e?.message});
    }
    
}





async function getProcessFullData(ocid){
    let response={};
      try{
        let responseProcess=await axios(
          {
            timeout: 20000,
            method: 'get',
            url: `${api_url}/ocds/record/${ocid}`,
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `${accessToken}`
            },
            params: {
            }
          }
        );
  
        response=responseProcess.data?.records?.[0]?.compiledRelease ?? {};
        }
        catch(e){
            Sentry?.captureException(e);
            await log(executionId,'Error en la Etapa 3 - Obtencion de compiledReleases','3_GET_COMPILED','error',{error:e?.message});
        }
      return response;
}






async function createOpportunitiesPreTable(){
    try{
        
        await pool.query(`CREATE TABLE IF NOT EXISTS ocds.opportunities_extraction(
            id          BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
            llamado     TEXT NULL,
            ocid        TEXT NULL,
            llamado_estado TEXT NULL,
            llamado_publicacion timestamptz NULL,
            checksum    TEXT NULL,
            data        JSONB NULL,
            modificacion timestamptz NULL,
            creacion timestamptz NOT NULL,
            CONSTRAINT ocds_opportunities_extract_pk PRIMARY KEY (id),
            CONSTRAINT ocds_opportunities_extract_ocid_unique UNIQUE (ocid)
        );`,[]);

        await pool.query(`
            DELETE FROM ocds.opportunities_extraction WHERE id IN (
            select d.id  from ocds.opportunities_extraction as d where (d.llamado_publicacion) < (NOW() - interval '16 month'));`,[]);
        //await client.end();
        return true;
        }
    catch(e){
        
        Sentry?.captureException(e);
    } 
    return false;
}

async function createOpportunitiesTable(){
    try{
        
        await pool.query(`CREATE TABLE IF NOT EXISTS  ocds.opportunities(
            id          BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
            llamado     TEXT NULL,
            ocid        TEXT NULL,
            llamado_estado TEXT NULL,
            llamado_publicacion timestamptz NULL,
            categoria TEXT NULL,
            categoria_detalle TEXT NULL,
            convocante TEXT NULL,
            convocante_id TEXT NULL,
            procedimiento TEXT NULL,
            titulo TEXT NULL,
            llamado_fecha_fin timestamptz NULL,
            checksum    TEXT NULL,
            data        JSONB NULL,
            modificacion timestamptz NULL,
            creacion timestamptz NOT NULL,
            CONSTRAINT  ocds_opportunities_pk PRIMARY KEY (id),
            CONSTRAINT  ocds_opportunities_ocid_unique UNIQUE (ocid)
        );`,[]);
        //await client.end();
        return true;
        }
    catch(e){
        
        Sentry?.captureException(e);
    } 
    return false;
}

async function insertRecord(record){
    try{
        
        let checksum = JSum.digest(record, 'SHA256', 'hex');
        await pool.query(`
            INSERT INTO ocds.opportunities_extraction
            (llamado,ocid,llamado_estado,llamado_publicacion,checksum,data,modificacion,creacion)
            VALUES($1, $2, $3, $4, $5, $6, NULL, NOW())
            ON CONFLICT ON CONSTRAINT ocds_opportunities_extract_ocid_unique
            DO UPDATE SET llamado = $1,  llamado_estado = $3, llamado_publicacion = $4, checksum = $5, data = $6, modificacion=NOW()
            WHERE ocds.opportunities_extraction.checksum <> $5;`,
        [
        record?.planning?.identifier ??  record?.ocid?.replace('ocds-03ad3f-','').split('-')[0] , //llamado
        record?.ocid, //ocid
        record?.tender?.statusDetails, //llamado_estado
        record?.tender?.datePublished, //llamado_publicacion
        checksum,
        record,

        ]);
        
/*
clasificacion_items,clasificacion_items_array,description_items_array
        record?.tender?.items?.map((item)=>{return item?.classification?.id})?.join('|') ?? null,
        record?.tender?.items?.map((item)=>{return item?.classification?.id}) ?? null,
        record?.tender?.items?.map((item)=>{return item?.description}) ?? null*/
    }
    catch(e){
        
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 5 - Insercion de pre registros','6_INSERT_PRE','error',{error:e?.message});
        //console.dir(e)
    }
}

async function insertOpportunities(){
    
    await log(executionId,'Inicio de Etapa 7 - Insercion de oportunidades','7_INSERT_OPP','info',null);
    try{
        
        await pool.query(`
            INSERT INTO ocds.opportunities
            (llamado,ocid,llamado_estado,llamado_publicacion,
            categoria,
            categoria_detalle,
            convocante,
            convocante_id,
            procedimiento,
            titulo,
            llamado_fecha_fin,
            checksum,data,modificacion,creacion)

            SELECT d.llamado, d.ocid,d.llamado_estado, d.llamado_publicacion,
            
            (d."data"::json->'tender'->>'mainProcurementCategory')::text as categoria,
            lower((d."data"::json->'tender'->>'mainProcurementCategoryDetails')::text) as categoria_detalle,
            lower((d."data"::json->'tender'->'procuringEntity'->>'name')::text) as convocante,
            (d."data"::json->'tender'->'procuringEntity'->>'id')::text as convocante_id,
            (d."data"::json->'tender'->>'procurementMethodDetails')::text as procedimiento,
            lower((d."data"::json->'tender'->>'title')::text) as titulo,
            (d."data"::json->'tender'->'tenderPeriod'->>'endDate')::timestamp as llamado_fecha_fin,
            d.checksum, d.data, d.modificacion, d.creacion from ocds.opportunities_extraction as d 

            ON CONFLICT ON CONSTRAINT ocds_opportunities_ocid_unique
            DO UPDATE SET llamado = excluded.llamado,  llamado_estado = excluded.llamado_estado, llamado_publicacion = excluded.llamado_publicacion,
            
            categoria= excluded.categoria,
            categoria_detalle = excluded.categoria_detalle,
            convocante= excluded.convocante,
            convocante_id= excluded.convocante_id,
            procedimiento=excluded.procedimiento,
            titulo=excluded.titulo,
            llamado_fecha_fin=excluded.llamado_fecha_fin,
            
            checksum = excluded.checksum, data = excluded.data, modificacion=NOW()
            WHERE ocds.opportunities.checksum <> excluded.checksum;
            
            
            `,
        [
        ]);

        await pool.query(`
            DELETE FROM ocds.opportunities as o WHERE o.ocid NOT IN (select d.ocid from ocds.opportunities_extraction as d);`,[]);
        
    }
    catch(e){
        
        Sentry?.captureException(e);
        await log(executionId,'Error en la Etapa 7 -Insercion de oportunidades','7_INSERT_OPP','error',{error:e?.message});
        //console.dir(e)
    }

    await log(executionId,'Fin de Etapa 7 - Insercion de oportunidades','7_INSERT_OPP','info',null);
    
}


async function createLogsTable(){
    try{
        //const client = new Client({ max: 50});
        //await client.connect();
        await pool.query(`CREATE TABLE IF NOT EXISTS ocds.opportunities_logs(
            id          BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
           
            
            ejecucion        TEXT NULL,
            etapa     TEXT NULL,
            mensaje     TEXT NULL,
            tipo        TEXT NULL,
            data        JSONB NULL,
            fecha timestamptz NOT NULL,
            CONSTRAINT ocds_opportunities_logs_pk PRIMARY KEY (id)
        );`,[]);
        ///await client.end();
        return true;
        }
    catch(e){
        log(executionId,'Error en la Etapa 0 - Creacion de tabla de logs','0_START','error',{error:e?.message});
        console.dir(e)
    } 
    return false;
}
async function log(executionId,message,stage,type,data){
    const date = moment.tz(new Date(), "America/Asuncion").format();
    try{
        /*let client = {};
        if(pool){
            client=pool;
        }else{
            client = new Client({ max: 50});
            client.connect();
        }*/
        await pool.query(`
            INSERT INTO ocds.opportunities_logs
            (
                ejecucion,etapa,mensaje,tipo,data,fecha
            )
            VALUES($1, $2, $3, $4, $5, $6);`,
        [
            executionId,
            stage,
            message,
            type,
            data,
            date
        ]);
        /*if(!pool){
            await client.end();
        }*/
        
    }
    catch(e){
        Sentry?.captureException(e);
    }

    console.dir(`------------------------------------`)
    console.dir(`${message} - ${date}`)
    console.dir(`${executionId}`)
    
}