const axios = require('axios');
const axiosRetry = require('axios-retry').default;
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
        GLOBAL.getString(error?.message).includes('EAI_AGAIN'));
    } 
});
//const db = require('./db');
var SITE_URL=process.env?.SITE_URL?process.env.SITE_URL:'https://www.contrataciones.gov.py';
var API_URL = `${SITE_URL}/datos/api/v3/doc`;


/**
 * En este Archivo se encuentra las funciones relacionadas a la obtencion de informacion del listado de todas las entidades convocantes
 */


/**
 * Obtiene el arreglo de los convocantes en formato OCDS
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {Array<*>}
 */
async function getProcuringEntities(executionId) {
   
    let access_token=''
    try{
        let response_access_token= await axios(
            {
            method: 'post',
            url: `${API_URL}/oauth/token`,
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
        //await db.log(executionId,'Error en la Etapa 0 - Error al obtener el token para procuring entities','0_START','error',{error:e.message});

        
    }
    
    let response={};
    try{
        let response_processes=await axios(
        {
            method: 'get',
            url: `${API_URL}/search/procuringEntities`,
            headers: { 
            'Content-Type': 'application/json',
            Authorization: `${access_token}`
            },
            params: {
            items_per_page: 1200
            }
        }
        );

        response=response_processes.data;



        if(response?.list?.length){
           return response.list;
        }
        }
        catch(e){
            
           //await db.log(executionId,'Error en la Etapa 0 - Error al obtener las procuring entities','0_START','error',{error:e.message});

            
        }
        return [];
    };

module.exports = { getProcuringEntities };