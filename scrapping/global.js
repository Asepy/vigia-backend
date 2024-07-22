const fixUtf8 = require('../utils/fix-utf8').fixUtf8;

let months= [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
]

/**
 * Convierte una cadena a un entero
 * @param {string} text Texto
 * @returns {number}
 */
function getInt(text){
    if(parseInt(text)){
        return parseInt(text);
    }else{
        return 0;
    }
}

/**
 * Verifica si una cadena es un entero
 * @param {string} text Texto
 * @returns {boolean}
 */
function isInt(text){
    return /^\d+$/g.test(getString(text))
}

/**
 * Convierte una cadena a un flotante
 * @param {string} text Texto
 * @returns {number}
 */
function getFloat(text){
    if(parseFloat(text)){
        return parseFloat(text);
    }else{
        return 0;
    }
}

/**
 * Convierte un valor a una cadena de texto
 * @param {*} text Valor
 * @returns {string}
 */
function getString(text){
    if(validate(text)){
        return text.toString();
    }else{
        return '';
    }
}

/**
 * Valida si un valor no es nulo o indefinido
 * @param {*} text 
 *@returns {boolean}
 */ 
function validate(text){
    if(text!=null&&text!=undefined){
        return true;
    }else{
        return false;
    }
}

/**
 * Valida si un valor no es nulo o indefinido o cadena vacia
 * @param {*} text 
 *@returns {boolean}
 */ 
function validateString(text){
    if(text!=null&&text!=undefined&&text!==''){
        return true;
    }else{
        return false;
    }
}

/**
 * Retorna un arreglo segmentado en varios arreglos
 * @param {*} a Arrreglo inicial
 * @param {*} n Cantidad de elementos del arreglo final 
 * @returns {Array<Array<*>>}
 */
function splitArray(a,n){
    return[...Array(Math.ceil(a.length/n))].map((_,i)=>a.slice(i*n,(i+1)*n));
}

/**
 * Corrige errores de UTF8 de una cadena de texo
 * @param {string} text 
 * @returns {string}
 */
function UTF8Fix(text){
    return fixUtf8(getString(text));
}


/**
 * Convierte un texto en los formatos 2000-31-12 | 2000-31-12 00:00 | 12-31-2000 | 12-31-2000 00:00  a una fecha
 * @param {string} text Texto
 * @returns {string}
 */
function getDateTextNormal(text){
    let hourString = '00:00:00';
    let dateString='';
    let regexString=[];

    if(validateString(text)){

        if(/(\d{1,2}-\d{1,2}-\d{4})/g.test(text)){
            regexString=text.match(/(\d{1,2}-\d{1,2}-\d{4})/g)[0].split('-');
            dateString=`${regexString[2]}-${regexString[1]}-${regexString[0]}`;

        }else if(/(\d{4}-\d{1,2}-\d{1,2})/g.test(text)){
            regexString=text.match(/(\d{4}-\d{1,2}-\d{1,2})/g)[0].split('-');
            dateString=`${regexString[0]}-${regexString[1]}-${regexString[2]}`;
        }

        if(/(\s{1}\d{1,2}:\d{1,2}:\d{1,2})/g.test(text)){
            hourString=`${getString(text.match(/(\s{1}\d{1,2}:\d{1,2}:\d{1,2})/g)[0]).trim()}`;
        }else if(/(\s{1}\d{1,2}:\d{1,2})/g.test(text)){
            hourString=`${getString(text.match(/(\s{1}\d{1,2}:\d{1,2})/g)[0]).trim()}:00`;
        }

        if(validateString(dateString)){
            return `${dateString} ${hourString}`;
        }
    }

    return '';
}


/**
 * Convierte un texto en los formatos jueves, 3 de octubre de 2024 - 09:00 00:00  a una fecha
 * @param {string} text Texto
 * @returns {string}
 */
function getTextDate(text){
 
    if(validateString(text) && /([a-zA-Z]+,\s+(\d{1,2}\s+)(([a-zA-Z]|\s)+)\d{4}\s+)/g.test(text)){

        
        let hour = '00:00:00';
        if(/(\s{1}\d{1,2}:\d{1,2}:\d{1,2})/g.test(getString(text))){
            hour=`${getString(getString(text).match(/(\s{1}\d{1,2}:\d{1,2}:\d{1,2})/g)[0]).trim()}`;
        }else if(/(\s{1}\d{1,2}:\d{1,2})/g.test(text)){
            hour=`${getString(getString(text).match(/(\s{1}\d{1,2}:\d{1,2})/g)[0]).trim()}:00`;
        }
        
        const dateText =getString(text).replace(/\s+/g,' ').match(/([a-zA-Z]+,\s+(\d{1,2}\s+)(([a-zA-Z]|\s)+)\d{4}\s+)/g)[0].toString().trim().toLowerCase();

        const numberDay = ("0" + dateText.match(/^([a-zA-Z]+,\s+(\d{1,2}\s+))/g)[0].toString().replace(/([a-zA-Z]+|,|\s+)/g,'')).slice(-2);

        const year = dateText.match( /(\s+\d{4})/g)[0].toString().replace(/\s+/g,'');

        let month = '';

        for (const [index, value] of months.entries()) {
            if(dateText.includes(value)){
                month = ("0" + (index+1)).slice(-2);
                break;
            }
        }


        


        return `${year}-${month}-${numberDay} ${hour}`;
    }else{
        return null;
    }
}


/**
 * Convierte un valor ₲ 157.500.000.000  a  amount en OCDS
 * @param {string} text Texto
 * @returns {*}
 */
function getTextAmount(text){
    let value = {
        amount:0
    }
    if(validate(text)){
        
        const amountText = getString(text).replace(/\./g,'').replace(',','.').replace(/\s+/g,' ').split(' ');

        if(amountText.length==2){
            value['amount'] = getFloat(amountText[1]);
            value['currency'] = getCurrency(amountText[0]);
        }else if(amountText.length==1 && getFloat(amountText[0]) > 0){
            value['amount'] =  getFloat(amountText[0]);
            value['currency'] = getCurrency('__');
        }else{
            return null;
        }

        return value;
    }else{
        return null;
    }
}

/**
 * Obtiene el valor en iso de tres caracteres de la moneda de un texto ₲
 * @param {string} text Texto
 * @returns {string}
 */
function getCurrency(text){
    switch(text){
        case '₲':
            return 'PYG'
        case 'US$':
            return 'USD'
        default:
            return 'PYG'
    }
}


/**
 * Obtiene el prefijo de la url de la informacion de un llamado
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getURLPrePath(processData){
    switch(processData.tipo_licitacion){
        case 'tradicional':
            return 'licitaciones';
        case 'convenio':
            return 'convenios-marco';
        case 'precalificacion':
            return 'licitaciones';
        case 'licitacion_sin_difusion':
            return 'sin-difusion-convocatoria';
        default:
            return 'licitaciones';
    }
}


/**
 * Obtiene el sufijo de la url de la informacion de un llamado
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getURLPostPath(processData){
    switch(processData.tipo_licitacion){
        case 'tradicional':
            return  processData?.convocatoria_slug?'/convocatoria':(processData?.planificacion_slug?'/planificacion':'/adjudicacion');
        case 'convenio':
            return '/convocatoria';
        case 'precalificacion':
            return '/precalificacion'
        case 'licitacion_sin_difusion':
            return (['CE - CVE con difusión previa'].includes(processData?.tipo_procedimiento)&&GLOBAL.validateString(processData.adjudicacion_slug)?'/excepcion_adj':'');
        default:
            return '/convocatoria';
    }
}


/**
 * Obtiene el primer slug de un llamado para consultar su informacion
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getURLSlugPath(processData){
    return getSlug(processData).split(',')[0];
}



/**
 * Obtiene el slug de un llamado para consultar su informacion
 * @param {*} processData JSON de un llamado del CSV del listado de Busqueda de licitaciones de la DNCP
 * @returns {string}
 */
function getSlug(processData){
    switch(processData.tipo_licitacion){
        case 'tradicional':
            return processData.convocatoria_slug?processData.convocatoria_slug:(processData.planificacion_slug?processData.planificacion_slug:processData.adjudicacion_slug);
        case 'convenio':
            return processData.convocatoria_slug;
        case 'precalificacion':
            return processData.precalificacion_slug;
        case 'licitacion_sin_difusion':
            return processData.adjudicacion_slug?processData.adjudicacion_slug:processData.planificacion_slug;
        default:
            return processData.convocatoria_slug;
    }
}



module.exports = { validate,validateString,getFloat,getInt,getString,months,UTF8Fix,isInt,getCurrency,getTextAmount,getTextDate,getDateTextNormal,getURLPrePath,getURLPostPath,getURLSlugPath,getSlug,splitArray }