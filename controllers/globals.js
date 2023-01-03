exports.sendResponse = (data,code) =>{
    return {
      statusCode: code?code:200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        //'Access-Control-Allow-Headers':'X-Access-Token,X-Id-Token,X-Refresh-Token,*'
      },
      body: JSON.stringify(
        data
      )
    };
  }

exports.getString=(text)=>{
    if(exports.validate(text)){
        return text.toString();
    }else{
        return '';
    }
}

exports.validateDate=(STRING)=>{
    STRING=exports.getString(STRING);
    return /(^\d{4}-((1(0|1|2))|(0(1|3|4|5|6|7|8|9)))-(((1|2)\d)|(0(1|2|3|4|5|6|7|8|9))|(3(0|1)))$)|(^\d{4}-(02)-(((1|2)\d)|(0(1|2|3|4|5|6|7|8|9)))$)/.test(STRING);
}

exports.validate=(text)=>{
    if(text!=null&&text!=undefined){
        return true;
    }else{
        return false;
    }
}
exports.validateString=(text)=>{
    if(text!=null&&text!=undefined&&text!==''){
        return true;
    }else{
        return false;
    }
}

exports.getNumber=(text)=>{
  if(Number(text)){
      return Number(text);
  }else{
      return 0;
  }
}


exports.getDateText=(DATE,FORMAT)=>{
    FORMAT=FORMAT.replace(/MONTH/g,("0" + (DATE.getMonth()+1)).slice(-2));
    FORMAT=FORMAT.replace(/YEAR/g,DATE.getFullYear());
    FORMAT=FORMAT.replace(/HOURS/g,("0" + DATE.getHours()).slice(-2));
    FORMAT=FORMAT.replace(/MINUTES/g,("0" + DATE.getMinutes()).slice(-2));
    FORMAT=FORMAT.replace(/SECONDS/g,("0" + DATE.getSeconds()).slice(-2));
    FORMAT=FORMAT.replace(/DAY/g,("0" + DATE.getDate()).slice(-2));
    FORMAT=FORMAT.replace(/MILI/g,("000"+ DATE.getMilliseconds()).slice(-3));
    return FORMAT;
}



exports.getTextKeyword=(text)=>{
    let textKeyword = exports.getString(text).trim().toLowerCase();
    textKeyword=textKeyword.replace(/á/,'a');
    textKeyword=textKeyword.replace(/é/,'e');
    textKeyword=textKeyword.replace(/í/,'i');
    textKeyword=textKeyword.replace(/ó/,'o');
    textKeyword=textKeyword.replace(/ú/,'u');
    return textKeyword;
  }
