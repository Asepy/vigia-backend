const axios = require('axios');
const axiosRetry = require('axios-retry').default;
axiosRetry(axios, { 
    retries: 10,
    retryDelay: (retryCount) => {
        return retryCount * 500;
    },
    retryCondition: (error) => {
                
        return ([502,503,504,500].includes(error?.response?.status) || 
        GLOBAL.getString(error?.message).includes('ETIMEDOUT')|| 
        GLOBAL.getString(error?.message).includes('ECONNRESET')|| 
        GLOBAL.getString(error?.message).includes('ECONNREFUSED')|| 
        GLOBAL.getString(error?.message).includes('EAI_AGAIN'));
    } 
});
const moment = require('moment-timezone');
//const csv=require('csvtojson');
const GLOBAL = require('./global');
//const db = require('./db');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

var SITE_URL=process.env?.SITE_URL?process.env.SITE_URL:'https://www.contrataciones.gov.py';


/**
 * En este Archivo se encuentra las funciones relacionadas a la obtencion de informacion de los items de un llamado
 */



/**
 * Obtiene el arreglo de los documentos en formato OCDS
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {Array<*>}
 */
async function getDocuments(processData,executionId){
    let documents = [];
    try{
        let response = await axios(
            {
              method: 'get',
              url:  getProcessDocumentsURL(processData),
              headers: { 
                'Content-Type': 'application/json'
              }
            }
        );

        const { document } = (new JSDOM(response.data)).window;

        

        for(const [index, row] of Array.from(document.querySelectorAll('table.table tbody tr')).entries()){
            let columns = row.querySelectorAll("td")
            let documentData = {
               id:index
            }

            

            if(GLOBAL.validateString(columns?.[0]?.textContent)){
                documentData['documentTypeDetails']=columns?.[0]?.textContent?.toString().trim();
            }

            if(GLOBAL.validateString(columns?.[1]?.textContent)){
            
                const dateDocument = GLOBAL.getDateTextNormal(columns?.[1]?.textContent?.toString().trim().replace(/\s+-\s+/g,' '))
                if(GLOBAL.validateString(dateDocument)){
                    documentData['datePublished']= moment.tz( dateDocument, "America/Asuncion").format();
                }
            }

            if(GLOBAL.validateString(columns?.[2]?.textContent)){
                documentData['title']=columns?.[2]?.textContent?.toString().trim();
            }

            if(GLOBAL.validateString(columns?.[3]?.querySelectorAll("a")?.[0]?.getAttribute("href"))){
                documentData['url']=`${SITE_URL}${columns?.[3]?.querySelectorAll("a")?.[0]?.getAttribute("href").toString().trim()}`;
            }

            documents.push(documentData);
            
            
        }


        
    }
    catch(e){
        //await db.log(executionId,'Error en la Etapa 2 - Error al procesar la informacion de los documentos','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_documents:getProcessDocumentsURL(processData),error:e.message});

    }
    //console.dir(response.data)

    return documents;
    
}

/**
 * Obtiene la URL Final donde se encuentra el HTML de los documentos
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getProcessDocumentsURL(processData){
    return `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}/documentos.html`
}

module.exports = { getDocuments };