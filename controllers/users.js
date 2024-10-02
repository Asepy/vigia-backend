const { Pool, Client } = require('pg');
const globals = require('./globals');
const CognitoJwtVerifier = require ("aws-jwt-verify").CognitoJwtVerifier;
exports.signUpUser = async (event, context, callback) => {
    try{
      let usuario={
        nombres:event.request.userAttributes.given_name,
        apellidos:event.request.userAttributes.family_name,
        correo:event.request.userAttributes.email, 
        usuario:event.userName, 
        contrasena:null, 
        confirmacion:false, 
        fecha_confirmacion:null, 
        estado:0, 
        fecha_modificacion:null, 
        fecha_creacion:''
      };
      
      const client = new Client();
      await client.connect();
      
      const res = await client.query(`INSERT INTO public.usuarios
      (nombres, apellidos, correo, usuario, contrasena, confirmacion, fecha_confirmacion, estado, fecha_modificacion, fecha_creacion,notificaciones)
      VALUES($1, $2, $3, $4, $5, FALSE, NULL, 1, NULL, NOW(),'SI');`,[usuario.nombres,usuario.apellidos,usuario.correo,usuario.usuario,usuario.contrasena]);
      await client.end();
      
      callback(null, event);
    }
    catch(e){
      callback(e, event);
      return;
    }
    
  };
  
 exports.signUpUserConfirm = async (event, context, callback) => {
  try{
    let usuario={
      nombres:event.request.userAttributes.given_name,
      apellidos:event.request.userAttributes.family_name,
      correo:event.request.userAttributes.email, 
      usuario:event.userName, 
      contrasena:null, 
      confirmacion:event.request.userAttributes.email_verified, 
      fecha_confirmacion:null, 
      estado:1, 
      fecha_modificacion:null, 
      fecha_creacion:''
    };
    
    const client = new Client();
    await client.connect();
    
    const res = await client.query(`UPDATE public.usuarios
    SET confirmacion = $1, fecha_confirmacion = NOW()
    WHERE correo = $2 AND usuario = $3;`,[usuario.confirmacion,usuario.correo,usuario.usuario]);
    await client.end();
    
    callback(null, event);
  }
  catch(e){
    callback(e, event);
    return;
  }
  };

  exports.getUserRoles = async (event) => {
    let payload={};
    try{
      payload=JSON.parse(event.body);
    }catch(e){
        return globals.sendResponse({
            message: e.message,
            error:true,
            input:event
            },404);
    }


    try{
      event['user']=await exports.getUserData(event);
      if(event?.user?.error){
        return globals.sendResponse(event?.user,404);
      }

      
      return globals.sendResponse(event.user.attributes.roles);

    }catch (e){
      return {
          error:true,
          token:"Fallo al obtener los roles",
          message:e.message
        }
      
    }

    
    };


    exports.getUser = async (event) => {
      let payload={};
      try{
        payload=JSON.parse(event.body);
      }catch(e){
          return globals.sendResponse({
              message: e.message,
              error:true,
              input:event
              },404);
      }
  
  
      try{
        event['user']=await exports.getUserData(event);
        if(event?.user?.error){
          return globals.sendResponse(event?.user,404);
        }
  
        
        return globals.sendResponse(event.user.attributes);
  
      }catch (e){
        return {
            error:true,
            token:"Fallo al obtener los roles",
            message:e.message
          }
        
      }
  
      
  };



  
exports.getUserData=async (event,checkRoles)=>{
    if(
      (!(event?.headers?.["c-access-token"])) ||
      (!(event?.headers?.["c-id-token"]))
    ){
      return {
        error:true,
        token:"No se enviaron tokens",
        message:"No se enviaron tokens",
        data:event?.headers
      }
    }

  
  // Verifier that expects valid access tokens:
 
  let userData={};
  try {
    const verifierIdToken = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: "id",
      clientId: process.env.COGNITO_CLIENT_ID,
      });
    const verifierAccessToken = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      tokenUse: "access",
      clientId: process.env.COGNITO_CLIENT_ID,
      });
    userData['idTokenData'] = await verifierIdToken.verify(
      event?.headers?.["c-id-token"]
    );
    userData['accessTokenData'] = await verifierAccessToken.verify(
      event?.headers?.["c-access-token"]
    );
    userData['attributes']={
      family_name:userData['idTokenData'].family_name,
      given_name:userData['idTokenData'].given_name,
      email:userData['idTokenData'].email,
      sub:userData['idTokenData'].sub,
      id:0
    }
  } catch (e){
    return {
        error:true,
        token:"Token invalido",
        message:e.message
      }
    
  }



  let result={};
  try{
    const client = new Client();
    await client.connect();
    result = await client.query(`select u.* from usuarios u where (u.correo = $1 or u.usuario = $2) limit 1;`,
    [userData?.attributes?.email,userData?.attributes?.sub]);
    await client.end();
  }
  catch(e){
    return {
      error:true,
      message:e,
      description:"error al obtener el usuario"
    }
  }

  
  
  let userDB={}
    if((result?.rows?.length)&&(result?.rows?.length>0)){
      try{
        userDB=result.rows[0];
        userData['attributes']['id']=userDB.id;
        userData['attributes']['notifications']=userDB.notificaciones;
        if(
          (userDB.nombres != userData?.attributes?.given_name) ||
          (userDB.apellidos != userData?.attributes?.family_name) ||
          (userDB.correo != userData?.attributes?.email) ||
          (userDB.usuario != userData?.attributes?.sub)
        ){
          console.log("el usuario cambio")
          const clientUpdate = new Client();
          await clientUpdate.connect();
          let resultUpdate = await clientUpdate.query(`UPDATE public.usuarios
          SET nombres=$2, apellidos=$3, correo=$4, usuario=$5, fecha_modificacion=NOW(), confirmacion=TRUE
          WHERE id=$1;
          `,
          [userData?.attributes?.id,userData?.attributes?.given_name,userData?.attributes?.family_name,userData?.attributes?.email,userData?.attributes?.sub]);
          await clientUpdate.end();
        }
      }
      catch(e){
        return {
          error:true,
          message:e,
          description:"error al actualizar el usuario"
        }
      }
      
    }else{
      try{
      console.log("usuario no encontrado")
      const clientInsert = new Client();
      await clientInsert.connect();
      
      let resultInsert = await clientInsert.query(`INSERT INTO public.usuarios
      (nombres, apellidos, correo, usuario, contrasena, confirmacion, fecha_confirmacion, estado, fecha_modificacion, fecha_creacion)
      VALUES($1, $2, $3, $4, NULL, TRUE, NOW(), 1, NULL, NOW()) RETURNING id;`,[userData?.attributes?.given_name,userData?.attributes?.family_name,userData?.attributes?.email,userData?.attributes?.sub]);
      await clientInsert.end();
      userData['attributes']['id']=resultInsert?.rows?.[0]?.id;
      userData['attributes']['notifications']="SI";
      console.log(userData?.attributes?.id);
      }
      catch(e){
        return {
          error:true,
          message:e,
          description:"error al insertar el usuario"
        }
      }
      
      //insert
    }


    try{
      const clientRoles = new Client();
      await clientRoles.connect();
      let resultRoles = await clientRoles.query(`
      select ru.rol from usuarios u 
      inner join roles_usuarios ru on u.id = ru.usuario  and u.id = $1 and u.estado = '1' and ru.estado = '1';`,
      [userData?.attributes?.id]);
      await clientRoles.end();
      let roles=resultRoles.rows.map((value) => {
        return value?.rol;
      });
      userData['attributes']['roles']=roles?roles:[];
    }
    catch(e){
      return {
        error:true,
        message:e,
        description:"error al obtener los roles"
      }
    }
    

    if(checkRoles){
      if(
        checkRoles?.length == 0 ||
        checkRoles.some((rol) => {
          if((!userData['attributes']['roles']?.includes)){
            return false;
          }
          return userData['attributes']['roles'].includes(rol);
        })
      ){
        return userData;
      }else{
        return {
          error:true,
          message:"Sin Autorizacion"
        }
      }
    }


    
    return userData;
  
  };


  module.exports.getUsers =async (event) => {
    //const { Pool, Client } = require('pg');
    let payload={};
    let consulta={};
    let pagination={};
    event['user']=await exports.getUserData(event,['SUPER']);
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
  
      
      pagination={
        page:globals.getNumber(payload.page)?globals.getNumber(payload.page):1,
        pageSize:globals.getNumber(payload.pageSize)?globals.getNumber(payload.pageSize):5,
      }
    }catch(e){
      return globals.sendResponse( {
        message: e.message,
        error:true,
        input:event
      },404);
    } 
    
    
    
    let result={};
    let filterArray=[];
  
    for (let filter of Object.keys(payload)){
      if(globals.validateString(payload[filter])){
        switch(filter){
          case 'search':
            filterArray.push({query:`AND (lower(u.nombres) LIKE lower(XVARIABLEX) OR lower(u.apellidos) LIKE XVARIABLEX OR u.usuario LIKE XVARIABLEX OR u.correo LIKE XVARIABLEX OR lower(u.confirmacion) LIKE lower(XVARIABLEX) OR lower(u.roles) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'creationDateE':
            filterArray.push({query:`AND (TO_DATE(u.fecha_creacion::TEXT,'YYYY-MM-DD') = XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGTE':
            filterArray.push({query:`AND (u.fecha_creacion >= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateGT':
            filterArray.push({query:`AND (TO_DATE(u.fecha_creacion::TEXT,'YYYY-MM-DD') > (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLTE':
            filterArray.push({query:`AND (u.fecha_creacion <= XVARIABLEX) `,variable:`${payload[filter]}`});
            break;
          case 'creationDateLT':
            filterArray.push({query:`AND (TO_DATE(u.fecha_creacion::TEXT,'YYYY-MM-DD') < (XVARIABLEX::date)) `,variable:`${payload[filter]}`});
            break;
            case 'rolesL':
              filterArray.push({query:`AND ( lower(u.roles) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
              break;
              case 'confirmationL':
              filterArray.push({query:`AND (lower(u.confirmacion) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
              break;
          case 'nameL':
            filterArray.push({query:`AND (lower(u.nombres) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'lastNameL':
            filterArray.push({query:`AND (lower(u.apellidos) LIKE lower(XVARIABLEX)) `,variable:`%${payload[filter]}%`});
            break;
          case 'mailL':
            filterArray.push({query:`AND (lower(u.correo) LIKE lower(XVARIABLEX)) `,variable:`${payload[filter]}`});
            break;
          default:
        }
      }
    }
    filterArray=filterArray.map(
      (filter,index)=>{
        return {query:filter.query.replace(/XVARIABLEX/g,`$${(index+4)}`), variable : filter.variable};
      }
    )
  
  
      try{
        const client = new Client();
        await client.connect();
        result = await client.query(`
        with users as (
          select u.id,u.nombres,u.apellidos,u.correo,u.usuario,u.confirmacion,u.fecha_creacion, coalesce  ((
          select string_agg(ru.rol,', ') from usuarios us inner join roles_usuarios ru on us.id =ru.usuario  and us.id = u.id and u.estado = '1' and ru.estado='1'
          ),'') as roles  from usuarios u 
          where exists  (select ru.rol from usuarios us 
            inner join roles_usuarios ru on us.id =ru.usuario  and us.id = $1 and ru.rol in ('SUPER') and us.estado = '1' and ru.estado='1'
            )
          ),
        users_case as(
          select u.id,u.nombres,u.apellidos,u.correo,u.usuario,
          (case WHEN (u.confirmacion  = TRUE) THEN 'VERIFICADO'
          ELSE
          'PENDIENTE'
          end) as confirmacion,
          u.fecha_creacion,
          (case WHEN (u.roles  = '') THEN 'Ninguno'
          ELSE
          u.roles
          end) as roles from users u
        )
          
        SELECT
      (SELECT COUNT(*) 
      from users_case u
      where TRUE
        ${filterArray.map((filter)=>{
          return filter.query;
        }).join('\n')}
      ) as total, 
      (SELECT json_agg(t.*) FROM (
        select u.id,u.nombres,u.apellidos,u.correo,u.usuario,u.confirmacion,u.fecha_creacion,u.roles from users_case u
      where TRUE
        ${filterArray.map((filter)=>{
          return filter.query;
        }).join('\n')}
        ORDER BY u.fecha_creacion DESC
        LIMIT $2
        OFFSET $3
      ) AS t) AS data;
        `,[...[consulta.usuario,pagination.pageSize,(pagination.pageSize*(pagination.page-1))],
          ...filterArray.map((filter)=>{
            return filter.variable;
          })
      ]);
        await client.end();
        }
        catch(e){
  
        return globals.sendResponse( {
            message: e.message,
            error:true,
            input:event
            },404);
      } 
    
    result['input']=event;
  
    return globals.sendResponse(
      result.rows[0]
    );
  };

  
module.exports.updateRoles =async (event) => {
  let payload={};
  let consulta={};
  event['user']=await exports.getUserData(event,['SUPER']);
  if(event?.user?.error){
    return globals.sendResponse({
      message: event?.user?.message,
      error:true
      },404);
  }
  try{
    payload=JSON.parse(event.body);
    if((!globals.validate(payload.roles))&&!Array.isArray(payload.roles)){
      return globals.sendResponse({
          message: "No se enviaron roles",
          error:true,
          input:event
          },404);
    }
    if((!globals.validateString(payload.userRole))){
      return globals.sendResponse({
          message: "No se envio el usuario del rol",
          error:true,
          input:event
          },404);
    }
  consulta={
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      usuario_rol:payload.userRole,
      roles:payload.roles
  };
  }catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
  } 
  

  

    try{
      const clientUpdate = new Client();
      await clientUpdate.connect();
      if(consulta.roles.length>0){
        await clientUpdate.query(`
        UPDATE public.roles_usuarios
        SET estado='0', fecha_modificacion=NOW()
        WHERE usuario=(select u.id from usuarios u where u.usuario = $1 limit 1) and rol not in (${
          consulta.roles.map((value,index)=>{
            return `$${(index + 2)}`;
          }).join(',')
        });`,
        [...[consulta.usuario_rol], ...consulta.roles]);
      }else{
        await clientUpdate.query(`
        UPDATE public.roles_usuarios
        SET estado='0', fecha_modificacion=NOW()
        WHERE usuario=(select u.id from usuarios u where u.usuario = $1 limit 1);`,
        [consulta.usuario_rol]);
      }
      
      await clientUpdate.end();

      if(consulta.roles.length>0){


      const client = new Client();
      await client.connect();
      for (let rol of consulta.roles) {
        await client.query(`
        INSERT INTO public.roles_usuarios
        (rol, usuario, estado, fecha_modificacion, fecha_creacion)
        (
          select $3, (select u.id from usuarios u where u.usuario = $2 limit 1), '1', NULL, NOW()
          where exists (select ru.rol from usuarios u 
            inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER') and u.estado = '1' and ru.estado='1'
            )
        )
        ON CONFLICT ON CONSTRAINT roles_usuarios_unique
        DO UPDATE SET rol=$3, usuario=(select u.id from usuarios u where u.usuario = $2 limit 1), estado='1', fecha_modificacion=NOW();`,
        [consulta.usuario,consulta.usuario_rol,rol]);
      }
      await client.end();


      }

      return globals.sendResponse({success:true, message:"Roles actualizados con exito"});
      
      }
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
};


module.exports.getRoles =async (event) => {
  let payload={};
  let consulta={};

  event['user']=await exports.getUserData(event,['SUPER']);
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
      result = await client.query(`
      select r.nombre,r.descripcion from roles r where r.estado= '1' and exists (select ru.rol from usuarios u 
        inner join roles_usuarios ru on u.id =ru.usuario  and u.id = $1 and ru.rol in ('SUPER') and u.estado = '1' and ru.estado='1'
        );`,[consulta.usuario]);
      await client.end();
      }
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
  result['input']=event;
  return globals.sendResponse(result.rows);
};

module.exports.setLogin =async (event) => {
  let payload={};
  let consulta={};
  event['user']=await exports.getUserData(event);
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
      result = await client.query(`
      INSERT INTO public.logeos
      (usuario, fecha_inicio, fecha_finalizacion)
      VALUES($1, NOW(),NULL) RETURNING id;`,[consulta.usuario]);
      await client.end();
      }
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
 
  return globals.sendResponse({id:result.rows[0].id});
};


module.exports.setLogout =async (event) => {
  let payload={};
  let consulta={};
  

  event['user']=await exports.getUserData(event);
  if(event?.user?.error){
    return globals.sendResponse({
      message: event?.user?.message,
      error:true
      },404);
  }
  
  try{
    payload=JSON.parse(event.body);
    let checkParams=globals.validateParams(["login"],payload);
    if(checkParams.error){
      return globals.sendResponse({
        message: checkParams.message,
        error:true,
        input:event
        },404);
    }
    consulta={
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      logeo:payload.login?payload.login:null
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
      result = await client.query(`
      UPDATE public.logeos
      SET fecha_finalizacion = NOW()
      WHERE usuario = $1 AND id = $2 AND fecha_finalizacion IS NULL;`,[consulta.usuario,consulta.logeo]);
      await client.end();
      }
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
 
  return globals.sendResponse({ok:true,result:result.rows});
};



module.exports.setNotifications =async (event) => {
  let payload={};
  let consulta={};
  event['user']=await exports.getUserData(event);
  if(event?.user?.error){
    return globals.sendResponse({
      message: event?.user?.message,
      error:true
      },404);
  }

  try{
    payload=JSON.parse(event.body);
    consulta={
      usuario:(event?.user?.attributes?.id)?(event?.user?.attributes?.id):null,
      notificaciones:(event?.notification)?(event?.notification):"SI",
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
      result = await client.query(`
      UPDATE public.usuarios
      SET notificationes=$2
      WHERE id=$1
      RETURNING id;`,[consulta.usuario,consulta.notificaciones]);
      await client.end();
      }
      catch(e){
      return globals.sendResponse({
          message: e.message,
          error:true,
          input:event
          },404);
    } 
  
 
  return globals.sendResponse({id:result.rows[0].id});
};