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
        GLOBAL.getString(error?.message).includes('EAI_AGAIN')||
        GLOBAL.getString(error?.message).includes('socket hang up'));
    } 
});
const Sentry = require("@sentry/node");
//const moment = require('moment-timezone');
const csv=require('csvtojson');
const GLOBAL = require('./global');
//const db = require('./db');
//const jsdom = require("jsdom");
//const { JSDOM } = jsdom;
var SITE_URL=process.env?.SITE_URL?process.env.SITE_URL:'https://www.contrataciones.gov.py';

/**
 * En este Archivo se encuentra las funciones relacionadas a la obtencion de informacion de los items de un llamado
 */


/**
 * Obtiene el arreglo de los items en formato OCDS
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {Array<*>}
 */
async function getItems(processData,executionId){
    let url=await getProcessItemsURLPrimary(processData,executionId);

    let response = {};

    let items=[];
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
        Sentry?.captureException(e);
        //await db.log(executionId,'Error en la Etapa 2 - Error al consultar el csv de los Items','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_items_csv:url,error:e.message});
        return items;
    }
    let itemsCSV = [];
    try{
        itemsCSV = await csv({
            delimiter:";",
            noheader:false,
            output: "json"
        }).fromString(response.data);
    }
    catch(e){
        //await db.log(executionId,'Error en la Etapa 2 - Error al convertir el CSV obtenido de los Items','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_items_csv:url,error:e.message});
        return items;
    }

    

    for (let itemData of itemsCSV){
        try{
            let item ={
                "id": itemData.id,
                 
                
                
                
                
            }

            let attributes =[];

            if(GLOBAL.validateString(itemData?.presentacion)){
               attributes.push(
                {
                    "name": "Presentacion",
                    "value": itemData.presentacion,
                    "id": "1"
                }
               )
            }
            if(GLOBAL.validateString(itemData?.numero)){
               attributes.push(
                {
                    "name": "Orden",
                    "value": itemData.numero,
                    "id": "2"
                }
               )
            }
            //"relatedLot": "IrubQ8fg6hs=",
            

            if(attributes.length>0){
                item["attributes"]=attributes;
            }
            if(GLOBAL.validateString(itemData?.producto_nombre_convocante)){
                item['description']=GLOBAL.UTF8Fix(itemData.producto_nombre_convocante);
            }

            if(GLOBAL.validateString(itemData?.producto_codigo)){
                item['classification']={
                    "scheme": "catalogoNivel5DNCP",
                    "id": itemData.producto_codigo
                   // "uri": ""
                };

                if(GLOBAL.validateString(itemData?.producto_nombre_catalogo)){
                    item['classification']['description']= GLOBAL.UTF8Fix(itemData.producto_nombre_catalogo);
                }
                item['additionalClassifications']= [
                    {
                        "scheme": "UNSPSC",
                        "id": GLOBAL.getString(itemData.producto_codigo).split('-')[0],
                        //"description": "Camaras de seguridad",
                        //"uri": ""
                    }
                ];
            }

            if(GLOBAL.validateString(itemData?.cantidad)&& GLOBAL.isInt(itemData?.cantidad)){
                item['quantity']= GLOBAL.getInt(itemData.cantidad);
            }


            if(GLOBAL.validateString(itemData?.unidad_medida)||(GLOBAL.validateString(itemData?.precio_unitario_estimado)&& GLOBAL.getFloat(itemData.precio_unitario_estimado)>0)){
                item['unit']= {};

                if(GLOBAL.validateString(itemData?.unidad_medida)){
                    item["unit"]["name"]=itemData.unidad_medida;
                }
                if(GLOBAL.validateString(itemData?._unidad_medida)){
                    item["unit"]["id"]=itemData._unidad_medida;
                }

                if(GLOBAL.validateString(itemData?.precio_unitario_estimado)&& GLOBAL.getFloat(itemData.precio_unitario_estimado)>0){
                    item["unit"]["value"]={}
                    item["unit"]["value"]["amount"]=GLOBAL.getFloat(itemData.precio_unitario_estimado);
                    if(GLOBAL.validateString(itemData?._moneda)){
                        item["unit"]["value"]["currency"]=itemData._moneda;
                    }
                    
                }
            }

            if(GLOBAL.validateString(itemData?.quantity)){
                item['quantity']= GLOBAL.getInt(itemData.cantidad);
            }
    
            items.push(item)
        }
        catch(e){
           // await db.log(executionId,'Error en la Etapa 2 - Error al procesar la informacion de un Item','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_items_csv:url,error:e.message});

        }
        
        
    }
    return items;
}

/**
 * Obtiene la URL Final donde se encuentra el CSV de los items
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns {string}
 */
async function getProcessItemsURLPrimary(processData,executionId){

    switch(processData.tipo_licitacion){
        case 'convenio':
            return  `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}/items.csv`;
        case 'tradicional':
            if((!GLOBAL.validateString(processData.convocatoria_slug))&&GLOBAL.validateString(processData.planificacion_slug)){
                return  `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}/items-solicitados.csv`;
            }
            break;
        default:
            break;
    }
    try{
        let response= await axios(
            {
              method: 'get',
              url:  getProcessItemsURL(processData),
              headers: { 
                'Content-Type': 'application/json'
              },
              data:{
                //"request_token": process.env.REQUEST_TOKEN_API_DNCP
              }
            }
           );
    
        if(/\$\('#items'\)\.load\('(.+)\.html'/g.test(response.data)){
            urls=response.data.match(/\$\('#items'\)\.load\('(.+)\.html'/g);
            if(urls.length>0){
                return `${SITE_URL}${urls[0].replace("$('#items').load('",'').replace("'",'').replace('.html','.csv')}`;
            }
        }
        return '';
    }
    catch(e){
        //await db.log(executionId,'Error en la Etapa 2 - Error al extraer la url de los Items','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),url_items:getProcessItemsURL(processData),error:e.message});
        

        return '';
    }
    

    
       
}
/**
 * Obtiene la url del html que contiene la informacion de la url del lote a consultar.
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getProcessItemsURL(processData){
    return `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}/items-solicitados.html`;
}



module.exports = { getItems };