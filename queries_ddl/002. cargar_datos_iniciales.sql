-- #######################################################
-- INSERCION DE CAMPOS EN LA TABLA DE CAMPOS DE PREGUNTAS
-- #######################################################

-- ****************************************************
-- INSERCION DE PREGUNTAS DE IDENTIFICACION DEL PROBLEMA
-- ****************************************************


INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_MARCA','¿Te parece que el proceso es direccionado por tener una marca?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_TIEMPO','¿Te parece que el proceso solicita demasiada experiencia en poco tiempo?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_ESTADO','¿Te parece que el proceso solicita demasiada experiencia con el estado?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_RATIO','¿Te parece que el proceso solicita demasiados ratios financieros?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_POLIZA','¿Te parece que el proceso solicita demasiadas pólizas de seguro?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_GARANTIA','¿Te parece que el proceso usó el correcto porcentaje de garantía financiera?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());
INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('P_IDEN_TIPO','¿Te parece que el tipo de proceso de contratación (contratación directa, licitación pública nacional, …) es incorrecto para el llamado?','RADIO_SINO','IDENPROBLEMA',1,NULL, NOW());



-- ****************************************************
-- INSERCION DE PREGUNTAS EN RELACION AL PLIEGO DE BASES Y CONDICIONES
-- ****************************************************


INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESOBJETO','Objeciones al objeto del llamado	','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESMODIRRE','Objeciones a modificaciones irregulares del PBC	','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESREQTEC','Objeciones a requisitos técnicos	','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESMODADJ','Objeciones a la modalidad de adjudicación o contratación adoptado','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESCONTRATACIONEXCEPCION','Objeciones a la contratación por vía de la excepción	','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESIMPSUB','Objeciones a la imposibilidad de subcontratar','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESCAPMATERIAPERS','Objeciones a requisitos de capacidad en materia de personal','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESMATEQUIPO','Objeciones a requisitos en materia de equipos','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESCERTISO','Objeciones sobre certificado ISO o certificaciones internacionales similares','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESALMU','Cuestiones específicas sobre almuerzo / merienda escolar','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESADCOMPU','Cuestiones específicas sobre adquisición de computadoras o notebooks','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESESPSEGUR','Cuestiones específicas sobre seguridad y vigilancia','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESPUBLLAM','Cuestiones relativas a la publicación del llamado','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESLLAMADCONSU','Cuestiones específicas sobre llamados por consultoría ','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESMUESTRA','Muestras','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESINTERMORA','Objeciones a intereses moratorios','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESREQLEG','Objeciones a requisitos legales','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESINSCRIPJUGA','Objeciones relativas a la inscripción o número de trabajadores inscriptos en el IPS','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESTALLEMECA','Cuestiones específicas sobre talleres mecánicos  ','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESREFPREV','Precio referencial previsto','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESOTRO','Otro','CHECK_SINO','PLIEGOBASE',1,NULL, NOW());



-- ****************************************************
-- INSERCION DE PREGUNTAS EN RELACION AL RESULTADO
-- ****************************************************


INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_RESULTADORELREQ','Cuestiones relativas a requisitos legales','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_OBJECIONESPRO','Objeciones al proceso de evaluación','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CUESTIONESREQTEC','Cuestiones relativas a requisitos técnicos','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CUESTREQFINA','Cuestiones relativas a requisitos financieros','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CARACSUSTANCIAL','Evaluación de documentos de carácter sustancial','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_DOCCARACFORM','Evaluación de documentos de carácter formal','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_ANPRECIO','Análisis de precios','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CERTORIGEN','Certificado de Origen Nacional','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CUESTIONESESPECALMU','Cuestiones específicas sobre almuerzo / merienda escolar','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CUESTIONESESPCOMP','Cuestiones específicas sobre adquisición de computadoras o notebooks','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CUESTIONESSEGVIGI','Cuestiones específicas sobre seguridad y vigilancia','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_CANCELICI','Cancelación de la licitación','CHECK_SINO','ALRESULTADO',1,NULL, NOW());

INSERT INTO public.campos
      (nombre,titulo,tipo,grupo,estado,fecha_modificacion,fecha_creacion)
      VALUES('CAMPO_RESUOTRO','Otro','CHECK_SINO','ALRESULTADO',1,NULL, NOW());


-- #######################################################
-- INSERCION DE ESTADOS EN LA TABLA DE TAREAS
-- #######################################################


-- ****************************************************
-- INSERCION DE ESTADOS DE RECLAMOS Y CONSULTAS
-- ****************************************************


INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('ENVIADO','Enviado a ASEPY', 'ASEPY', 'CONSULTA|RECLAMO', '1', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('REVISION','En revisión de ASEPY', 'ASEPY', 'CONSULTA|RECLAMO', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('COMUNICACION','En comunicación con UOC', 'UOC', 'CONSULTA|RECLAMO', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('PROTESTA','En protesta', 'UOC', 'CONSULTA|RECLAMO', '0', '1', NULL, NOW());



INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('DEVUELTO_SIN_FUNDAMENTOS','Devuelto por no tener fundamentos', 'Usuario', 'RECLAMO', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('DEVUELTO_NO_CLARA','Devuelta por no ser una consulta clara', 'Usuario', 'CONSULTA', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('DEVUELTO','Devuelto por otros motivos', 'Usuario', 'CONSULTA|RECLAMO', '0', '1', NULL, NOW());



INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('RESUELTO_SATISFACTORIAMENTE','Resuelto de forma satisfactoria', 'Usuario', 'RECLAMO', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('RESUELTO_INSATISFACTRIAMENTE','Resuelto de forma no satisfactoria', 'Usuario', 'RECLAMO', '0', '1', NULL, NOW());


INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('RESUELTO_RESPUESTA','Consulta Resuelta', 'Usuario', 'CONSULTA', '0', '1', NULL, NOW());

INSERT INTO public.tareas
(nombre, descripcion, encargado, grupo, defecto, estado, fecha_modificacion, fecha_creacion)
VALUES('RESUELTO_SIN_RESPUESTA','Consuta sin Resolución', 'Usuario', 'CONSULTA', '0', '1', NULL, NOW());

-- #######################################################
-- INSERCION EN LA TABLA DE ROLES
-- #######################################################



-- ****************************************************
-- INSERCION DE POSIBLES ROLES DE LOS USUARIOS EN EL SISTEMA
-- ****************************************************


INSERT INTO public.roles
(nombre, descripcion, estado, fecha_modificacion, fecha_creacion)
VALUES('SUPER', 'Usuario con todos los permisos, puede modificar roles de usuarios', '1', NULL, NOW());

INSERT INTO public.roles
(nombre, descripcion, estado, fecha_modificacion, fecha_creacion)
VALUES('ASEPY', 'Usuario basico de un agente de ASEPY, puede gestionar solicitudes y ver reportes', '1', NULL, NOW());

INSERT INTO public.roles
(nombre, descripcion, estado, fecha_modificacion, fecha_creacion)
VALUES('SUPERASEPY', 'Usuario con todos los permisos ASEPY, puede gestionar solicitudes y ver reportes, (se reserva para un futuro).', '1', NULL, NOW());


-- #######################################################
-- INSERCION EN LA TABLA DE ROLES USUARIOS
-- #######################################################



-- ****************************************************
-- INSERCION DE ASIGNACION DE ROL A UN USUARIO
-- ****************************************************
--INSERT INTO public.roles_usuarios (rol, usuario, estado, fecha_modificacion, fecha_creacion) VALUES('SUPER', 1, '1', NULL,NOW());