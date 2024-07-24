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
const moment = require('moment-timezone');
const csv=require('csvtojson')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
require('dotenv').config()




const GLOBAL = require('./global');

const {getItems} = require('./items');
const {getDocuments} = require('./documents');
const {getNotifiedSuppliers} = require('./notifiedSuppliers');
const {getProcuringEntities} = require('./procuringEntities');


const buyers = require('../utils/buyers.json');
const mainProcurementCategories = require('../utils/mainProcurementCategories.json');
const procuringEntities =  require('../utils/procuringEntities.json').list//[];

var SITE_URL=process.env?.SITE_URL?process.env.SITE_URL:'https://www.contrataciones.gov.py';

const Sentry = require("@sentry/node");

async function getProcessData(call,check){
    
  let params ={

      "nro_nombre_licitacion": call/*,
      "fecha_desde": "",
      "fecha_hasta": "",
      "tipo_fecha": "",
      "convocante_tipo": "",
      "convocante_nombre_codigo": "",
      "codigo_contratacion": "",
      "catalogo[codigos_catalogo_n4]": "",
      "page": "",
      "order": "",
      "convocante_codigos": "",
      "convocante_tipo_codigo": "",
      "unidad_contratacion_codigo": "",
      "catalogo[codigos_catalogo_n4_label]": ""*/
      
  };

try{
    let responseCSV= await axios(
        {
          method: 'get',
          url: `https://www.contrataciones.gov.py/buscador/licitaciones.csv`,
          headers: { 
            'Content-Type': 'application/json'
          },
          params:params
        }
       );
    //console.dir(params)
    //console.dir(responseCSV.request.path)
  
    let processesCSV = await csv({
        delimiter:";",
        noheader:false,
        output: "json"
        }).fromString(responseCSV.data);
  
       // ,"_etapa_licitacion":"INC"
  
    delete (responseCSV);
      if(processesCSV[0]){
  
      if(check){
          return true;
      }
      return await getProcessJSON(processesCSV[0],1);
      }
      return null;
}catch(e){
    console.dir(e)
    Sentry?.captureException(e);
}
  
  
  }
  


/**
 * Consulta la pagina HTML de visualizacion de un llamado y transforma los datos a OCDS
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @param {string} executionId Identificador de ejecucion del Scrapper
 * @returns 
 */
async function getProcessJSON(processData,executionId){
 
  try{
      //procuringEntities = await  getProcuringEntities(executionId);
      let processOCDS = {
          /*buyer:{
              
          },*/
          ocid:`ocds-03ad3f-${processData.nro_licitacion}-${GLOBAL.getSlug(processData).split(',').length}`,
          planning: {
              identifier: processData.nro_licitacion
          },
          tender: {
              procuringEntity:{
                  name:processData.convocante
              },
              title:GLOBAL.UTF8Fix(processData.nombre_licitacion),
              id:GLOBAL.getSlug(processData).split(',')[0],
             
             
              
              

          }
      }

      if(GLOBAL.validateString(processData?.fecha_publicacion_convocatoria) && GLOBAL.getDateTextNormal(processData.fecha_publicacion_convocatoria)){
          processOCDS.tender['datePublished']=moment.tz(GLOBAL.getDateTextNormal(processData.fecha_publicacion_convocatoria), "America/Asuncion").format();
          if(!GLOBAL.validate(processOCDS.tender['enquiryPeriod'])){
              processOCDS.tender['enquiryPeriod']={};
          }
          processOCDS.tender['enquiryPeriod']['startDate']=processOCDS.tender['datePublished'];

          if(!GLOBAL.validate(processOCDS.tender['tenderPeriod'])){
              processOCDS.tender['tenderPeriod']={};
          }
          processOCDS.tender['tenderPeriod']['startDate']=processOCDS.tender['datePublished'];
          

      }

      if(GLOBAL.validateString(processData?.fecha_entrega_oferta)&& GLOBAL.getDateTextNormal(processData.fecha_entrega_oferta)){
          if(!GLOBAL.validate(processOCDS.tender['tenderPeriod'])){
              processOCDS.tender['tenderPeriod']={};
          }
          processOCDS.tender['tenderPeriod']['endDate']=moment.tz(GLOBAL.getDateTextNormal(processData.fecha_entrega_oferta), "America/Asuncion").format();
      }


      if(GLOBAL.validateString(processData?.tipo_procedimiento)){
          processOCDS.tender['procurementMethodDetails']=processData.tipo_procedimiento;
      }
      if(GLOBAL.validateString(processData?.categoria)){
          processOCDS.tender['mainProcurementCategoryDetails']=processData.categoria;
      }
      if(GLOBAL.validateString(processData?.etapa_licitacion)){
          processOCDS.tender['statusDetails']=processData.etapa_licitacion;
      }


      if(GLOBAL.validateString(processData?._etapa_licitacion)){
          if(['PUB','IMP_PAR','CIMP','CONV','RP','PLAN','PREC','EVAL'].includes(processData._etapa_licitacion)){
              processOCDS.tender['status']='active';
          }else if(['CAN'].includes(processData._etapa_licitacion)){
              processOCDS.tender['status']='cancelled';
          }else if(['DES','SUS','CAD','IMP_SUS','IMP_PAR_SUS'].includes(processData._etapa_licitacion)){
              processOCDS.tender['status']='unsuccessful';
          }else if(['ADJ'].includes(processData._etapa_licitacion)){
              processOCDS.tender['status']='complete';
          }else if(['ANU'].includes(processData._etapa_licitacion)){
              processOCDS.tender['status']='withdrawn';
          }
          
      }
  

    
      
      


      let response= await axios(
          {
            method: 'get',
            url: getProcessPageURL(processData),
            headers: { 
              'Content-Type': 'application/json'
            }
          }
         );
      const { document } = (new JSDOM(response.data)).window;



      if((!GLOBAL.validateString(processData?.fecha_publicacion_convocatoria))||(!GLOBAL.getDateTextNormal(processData.fecha_publicacion_convocatoria))){
          //Fecha de Publicación
          //28-06-2024 - 15:59

          const datePublished = getProcessProperty('Fecha de Publicación',document);

          const datePublishedText = GLOBAL.getDateTextNormal(datePublished);
          if(GLOBAL.validateString(datePublishedText)){
              processOCDS.tender['datePublished']= moment.tz(datePublishedText, "America/Asuncion").format();
              if(!GLOBAL.validate(processOCDS.tender['enquiryPeriod'])){
                  processOCDS.tender['enquiryPeriod']={};
              }
              processOCDS.tender['enquiryPeriod']['startDate']=processOCDS.tender['datePublished'];

              if(!GLOBAL.validate(processOCDS.tender['tenderPeriod'])){
                  processOCDS.tender['tenderPeriod']={};
              }
              processOCDS.tender['tenderPeriod']['startDate']=processOCDS.tender['datePublished'];

          }
          
      }

      let tags = [];
      if (checkProcessTag('Accesible para MIPYMES',document)){
          tags.push(
              {
                  "sme": true
              }
          )
      }else{
          tags.push(
              {
                  "sme": false
              }
          )
      }
      if (tags.length>0){
          processOCDS.tender['suitability'] = tags;
      }
      
      

      const enquiryText = getProcessProperty('Fecha Límite de Consultas',document);
      if(GLOBAL.validateString(enquiryText)){
          let dateValue = GLOBAL.getTextDate(enquiryText);
          if(dateValue){
              if(!GLOBAL.validate(processOCDS.tender['enquiryPeriod'])){
                  processOCDS.tender['enquiryPeriod']={};
              }
              processOCDS.tender.enquiryPeriod['endDate']= moment.tz(dateValue, "America/Asuncion").format();
          }
      }

      const procurementMethodDetails = getProcessProperty('Tipo de Procedimiento',document);

      if( GLOBAL.validateString(procurementMethodDetails)){
          
          processOCDS.tender['procurementMethodDetails']=procurementMethodDetails.replace(/^[a-zA-z]+\s-\s+/,'')
      }


      const submissionMethodDetails = getProcessProperty('Lugar de Entrega de Ofertas',document);

      if( GLOBAL.validateString(submissionMethodDetails)){
          processOCDS.tender['submissionMethodDetails']=`Lugar entrega ofertas: ${submissionMethodDetails}` 
      }


      
      
      /*CISOFT */
      const awardCriteriaDetails = getProcessProperty('Sistema de Adjudicación',document);
      if( GLOBAL.validateString(awardCriteriaDetails)){
          processOCDS.tender['awardCriteriaDetails']=`${awardCriteriaDetails}` 
      }


      const budget = getProcessProperty('Fuente de Financiamiento',document);
      if( GLOBAL.validateString(budget)){

          const budgets=budget.split(' - ');
          let budgetBreakdown = [

          ];

          for( const [index, budgetData] of budgets.entries())
          {

              if(/\(Fuente\s+\w+\)/g.test(budgetData)){
                  let budgetBreak={
                      id: index,
                      classifications:{
                          fuente_financiamiento:budgetData.toString().match(/\(Fuente\s+\w+\)/g)?.[0]?.replace(/(\(Fuente\s+|\))/g,''),
                          description:budgetData
                      }
                  }
                  budgetBreakdown.push(budgetBreak)
              }

              
          }

          if(budgetBreakdown.length>0){
              if(!GLOBAL.validate(processOCDS.planning['budget'])){
                  processOCDS.planning['budget']={};
              }
              processOCDS.planning['budget']['budgetBreakdown']=budgetBreakdown
          }
      }

      const awardPeriodstartDate = getProcessProperty('Fecha de Entrega de Ofertas',document);
      if( GLOBAL.validateString(awardPeriodstartDate)){
          let awardPeriodstartDateValue = GLOBAL.getTextDate(awardPeriodstartDate);
          if(awardPeriodstartDateValue){
              if(!GLOBAL.validate(processOCDS.tender['awardPeriod'])){
                  processOCDS.tender['awardPeriod']={};
              }
              processOCDS.tender.awardPeriod['startDate']= moment.tz(awardPeriodstartDateValue, "America/Asuncion").format();

          }
      }

      const bidOpeningDate = getProcessProperty('Fecha de Apertura de Ofertas',document);
      if( GLOBAL.validateString(bidOpeningDate)){
          let bidOpeningDateValue = GLOBAL.getTextDate(bidOpeningDate);
          if(bidOpeningDateValue){
              if(!GLOBAL.validate(processOCDS.tender?.['bidOpening'])){
                  processOCDS.tender['bidOpening']={};
              }
              processOCDS.tender.bidOpening['date']= moment.tz(bidOpeningDateValue, "America/Asuncion").format();

          }
      }




      const bidOpeningStreetAddress = getProcessProperty('Lugar de Apertura de Ofertas',document);
      if( GLOBAL.validateString(bidOpeningStreetAddress)){
          if(!GLOBAL.validate(processOCDS.tender['bidOpening'])){
              processOCDS.tender['bidOpening']={};
          }
          if(!GLOBAL.validate(processOCDS.tender.bidOpening['address'])){
              processOCDS.tender.bidOpening['address']={};
          }
          processOCDS.tender.bidOpening.address['streetAddress']=`${bidOpeningStreetAddress}` 
      }

      const enquiriesAddress = getProcessProperty('Lugar para Realizar Consultas',document);
      if( GLOBAL.validateString(enquiriesAddress)){
          if(!GLOBAL.validate(processOCDS.tender['enquiriesAddress'])){
              processOCDS.tender['enquiriesAddress']={};
          }
          processOCDS.tender.enquiriesAddress['streetAddress']=`${enquiriesAddress}` 
      }

      const eligibilityCriteria = getProcessObservation('Restricciones de la Convocante',document);
      if( GLOBAL.validateString(eligibilityCriteria)){
          processOCDS.tender['eligibilityCriteria']=`Restricciones: ${eligibilityCriteria}`;
      }


      

      /*CISOFT */



      if(GLOBAL.validateString(processOCDS.tender.mainProcurementCategoryDetails)){
          const category =mainProcurementCategories.filter((category)=>{
              return (processOCDS.tender.mainProcurementCategoryDetails.includes(category.mainProcurementCategoryDetails));
          })?.[0];

          if(category){
              processOCDS.tender['mainProcurementCategory'] = category.mainProcurementCategory;
          }
      }

      





     

     
      const amountText = getProcessProperty('Monto Estimado',document);
      
      if(GLOBAL.validateString(amountText)){
          let value=  GLOBAL.getTextAmount(amountText);
          if(value){
              processOCDS['tender']['value']=value;
          }

      }


      const procuringEntity = getProcessProperty('Convocante',document);

      if( GLOBAL.validateString(procuringEntity)){
          processOCDS['tender']['procuringEntity']={}
          processOCDS['tender']['procuringEntity']['name']= procuringEntity;            
      }

      const procuringEntityData = await getProcuringEntity(processOCDS['tender']['procuringEntity']['name']);
      
      if(procuringEntityData){
          processOCDS['tender']['procuringEntity']['id']= procuringEntityData.id;   
      }


      if(GLOBAL.validateString(processOCDS['tender']?.procuringEntity?.id)){
          if(buyers[processOCDS.tender.procuringEntity.id]){
              processOCDS['buyer'] = structuredClone(buyers[processOCDS.tender.procuringEntity.id]);
          }
      }


      

      const emailContactPoint=getProcessProperty('Correo Electrónico',document);
      const nameContactPoint=getProcessProperty('Nombre',document);
      const telephoneContactPoint=getProcessProperty('Teléfono',document);

      if(GLOBAL.validateString(emailContactPoint)||GLOBAL.validateString(nameContactPoint)||GLOBAL.validateString(telephoneContactPoint)){
          let contactPoint ={
              
          };

          if(GLOBAL.validateString(emailContactPoint)){
              contactPoint['email']=emailContactPoint;
          }
          if(GLOBAL.validateString(nameContactPoint)){
              contactPoint['name']=nameContactPoint;
          }

          if(GLOBAL.validateString(telephoneContactPoint)){
              contactPoint['telephone']=telephoneContactPoint;
          }

          if(processOCDS.tender?.procuringEntity?.id){
              if(processOCDS?.buyer?.id){
                  if(processOCDS.tender.procuringEntity.id === processOCDS.buyer.id){
                      processOCDS['parties']=[
                          {
                              id:processOCDS.tender.procuringEntity.id,
                              name:processOCDS.tender.procuringEntity.name,
                              contactPoint:contactPoint,
                              roles:['buyer','procuringEntity']
                          }
                      ]
                  }else{
                      processOCDS['parties']=[
                          {
                              id:processOCDS.buyer.id,
                              name:processOCDS.buyer.name,
                              contactPoint:contactPoint,
                              roles:['buyer']
                          },
                          {
                              id:processOCDS.tender.procuringEntity.id,
                              name:processOCDS.tender.procuringEntity.name,
                              contactPoint:contactPoint,
                              roles:['procuringEntity']
                          }
                      ]
                  }
  
              }else{
                  processOCDS['parties']=[
                      {
                          id:processOCDS.tender.procuringEntity.id,
                          name:processOCDS.tender.procuringEntity.name,
                          contactPoint:contactPoint,
                          roles:['procuringEntity']
                      }
                  ]
              }
          }
      }

      

      
         

      
      if (checkProcessTab('Ítems Solicitados',document)){
          let items = await getItems(processData,executionId);
          if(items?.length){
              processOCDS['tender']['items']=items;
          }
      }

        /*
      if (checkProcessTab('Documentos',document)){
          let documents = await getDocuments(processData,executionId);
          if(documents?.length){
              processOCDS['tender']['documents']=documents;
          }
      }


      if (checkProcessTab('Invitados',document)){
          let notifiedSuppliersData = await getNotifiedSuppliers(processData,executionId);
          if(!GLOBAL.validate(processOCDS['parties'])){
              processOCDS['parties']=[];
          }

          if(notifiedSuppliersData?.notifiedSuppliers?.length){
              processOCDS['tender']['notifiedSuppliers']=notifiedSuppliersData.notifiedSuppliers;
          }
          if(notifiedSuppliersData?.notifiedSuppliersParties?.length){
              processOCDS['parties']=[ ...processOCDS['parties'],...notifiedSuppliersData.notifiedSuppliersParties];
          }
      }

      */
      
      



      

      
      return processOCDS;
     
  }
  catch(e){
    console.dir(e)
    Sentry?.captureException(e);
      //await db.log(executionId,'Error en la Etapa 2 - Error al obtener la informacion de un proceso','2_GET_DATA','error',{proceso:processData,url:getProcessPageURL(processData),error:e.message});

  }
}


/**
 * Obtiene la url para consultar la pagina HTML de un llamado
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns 
 */
function getProcessPageURL(processData){
  return `${SITE_URL}/${GLOBAL.getURLPrePath(processData)}${GLOBAL.getURLPostPath(processData)}/${GLOBAL.getURLSlugPath(processData)}.html`;
}





/**
* Obtiene el valor de una propiedad del llamado dentro del HTML
* @param {string} title nombre de la propiedad del llamado a buscar
* @param {*} document Objeto documento del JSDOM para realizar queries
* @returns 
*/
function getProcessProperty(title,document){
  let value = '';

  const regex=new RegExp(`^(\\s)*${title}(\\s)*$`, "g");
  
  try{
      value = Array.from(document.querySelectorAll('div.info-label')).filter((element)=>{ 
          //element.textContent.includes(title);
          return regex.test(element.textContent); })?.[0]?.nextElementSibling.textContent
  }
  catch(e){
      console.dir(e)
  }
  return value?value.toString().trim():'';
}


/**
* Obtiene el valor de una observacion del llamado dentro del HTML
* @param {string} title nombre de la observacion del llamado a buscar
* @param {*} document Objeto documento del JSDOM para realizar queries
* @returns 
*/
function getProcessObservation(title,document){
  let value = '';

  const regex=new RegExp(`(\\s)*${title}(\\s)*`, "g");
  
  try{
      let nodes= Array.from(document.querySelectorAll('ul li strong')).filter((element)=>{ 
          return regex.test(element.textContent); })?.[0]?.parentElement?.childNodes;
      if(nodes){
          value =Array.from(nodes)?.filter((node)=>{return node?.nodeType === 3;})?.[0]?.textContent
      }
  }
  catch(e){
      console.dir(e)
  }
  return value?value.toString().trim():'';
}




/**
* Verifica si un llamado tiene una etiqueta en especifico
* @param {string} title nombre de la etiqueta del llamado a buscar
* @param {*} document Objeto documento del JSDOM para realizar queries
* @returns 
*/
function checkProcessTag(title,document){
  let value = false;

  const regex=new RegExp(`^(\\s)*${title}(\\s)*$`, "g");
  
  try{
      value = Array.from(document.querySelectorAll('div.tags span.tag')).filter((element)=>{ 
          //element.textContent.includes(title);
          return regex.test(element.textContent); })?.[0] ? true : false;
  }
  catch(e){
      console.dir(e)
  }
  return value;
}



/**
* Verifica si un llamado tiene una pestaña
* @param {string} title nombre de la pestaña del llamado a buscar
* @param {*} document Objeto documento del JSDOM para realizar queries
* @returns 
*/
function checkProcessTab(title,document){
  let value = false;

  const regex=new RegExp(`^(\\s)*${title}(\\s)*$`, "g");
  
  try{
      value = Array.from(document.querySelectorAll('ul.nav-tabs li[role=presentation] a')).filter((element)=>{ 
          //element.textContent.includes(title);
          return regex.test(element.textContent); })?.[0] ? true : false;
  }
  catch(e){
      console.dir(e)
  }
  return value;
}




/**
 * Obtiene la informacion de una entidad convocante por su nombre
 * @param {string} name nombre de la entidad convocante
 * @returns 
 */
async function getProcuringEntity(name) {

    let procuringEntity = procuringEntities.filter((data)=>{
        return data.name.toLowerCase().includes(name.toLowerCase());
    })?.[0];

    return procuringEntity;

    
};

module.exports = { getProcessData};