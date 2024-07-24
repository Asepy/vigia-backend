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
const csv=require('csvtojson');
const GLOBAL = require('./global');
//const db = require('./db');

var SITE_URL=process.env?.SITE_URL?process.env.SITE_URL:'https://www.contrataciones.gov.py';

/**
 * En este Archivo se encuentra las funciones relacionadas a la obtencion de informacion de los proveedores notificados de un llamado
 */


/**
 * Obtiene el arreglo de los proveedores notificados en formato OCDS
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {Array<*>}
 */
async function getNotifiedSuppliers(processData,executionId){
    let url=await getProcessNotifiedSuppliersURL(processData);

    let response = {};

    let notifiedSuppliers=[];
    let notifiedSuppliersParties=[]
    try{
        response = await axios(
            {
              method: 'get',
              url:  url,
              headers: { 
                'Content-Type': 'application/json'
              }
            }
        );
    }
    catch(e){
        //await db.log(executionId,'Error en la Etapa 2 - Error al consultar el csv de los provedores invitados','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_proveedores_csv:url,error:e.message});
        return {notifiedSuppliers:notifiedSuppliers,notifiedSuppliersParties:notifiedSuppliersParties};
    }
    let notifiedSuppliersCSV = [];
    try{
        
        notifiedSuppliersCSV = await csv({
            delimiter:";",
            noheader:false,
            output: "json"
        }).fromString(response.data);
    }
    catch(e){
        //await db.log(executionId,'Error en la Etapa 2 - Error al convertir el CSV obtenido de los provedores invitados','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_proveedores_csv:url,error:e.message});
        return {notifiedSuppliers:notifiedSuppliers,notifiedSuppliersParties:notifiedSuppliersParties};
    }

    

    for (let notifiedSupplierData of notifiedSuppliersCSV){
        try{
            let notifiedSupplier ={
                "id": notifiedSupplierData?.ruc?`PY-RUC-${notifiedSupplierData?.ruc}`:notifiedSupplierData?.id,
                "name":notifiedSupplierData?.nombre                
            }

            let contactPoint ={
                
            };

            if(GLOBAL.validateString(notifiedSupplierData?.email)){
                contactPoint['email']=notifiedSupplierData?.email;
            }
            if(GLOBAL.validateString(notifiedSupplierData?.nombre)){
                contactPoint['name']=notifiedSupplierData?.nombre;
            }

            if(GLOBAL.validateString(notifiedSupplierData?.telefono)){
                contactPoint['telephone']=notifiedSupplierData?.telefono;
            }

            let party ={
                id:notifiedSupplier.id,
                name:notifiedSupplier.name,
                roles:['notifiedSupplier']
            }
            
            if(GLOBAL.validateString(contactPoint?.email)||GLOBAL.validateString(contactPoint?.name)||GLOBAL.validateString(contactPoint?.telephone)){
                party['contactPoint']=contactPoint;
            }


            
            
            notifiedSuppliers.push(notifiedSupplier);
            notifiedSuppliersParties.push(party);
        }
        catch(e){
           // await db.log(executionId,'Error en la Etapa 2 - Error al procesar la informacion de un proveedor invitado','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_proveedores_csv:url,error:e.message});

        }
        
        
    }
    return {notifiedSuppliers:notifiedSuppliers,notifiedSuppliersParties:notifiedSuppliersParties};
}


/**
 * Obtiene la URL Final donde se encuentra el CSV de los proveedores invitados
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {string}
 */
function getProcessNotifiedSuppliersURL(processData){
    return `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}/invitados.csv`
}

module.exports = { getNotifiedSuppliers };