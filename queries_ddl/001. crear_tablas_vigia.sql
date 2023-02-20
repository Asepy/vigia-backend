-- ****************************************************
-- CREACION DE TABLA DE USUARIOS
-- ****************************************************
CREATE TABLE IF NOT EXISTS public.usuarios
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    nombres character varying(255)  NOT NULL,
    apellidos character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    usuario character varying(255) NOT NULL,
    contrasena character varying(255),
    confirmacion boolean NOT NULL DEFAULT FALSE,
    fecha_confirmacion timestamptz,
    estado character varying(255) NOT NULL DEFAULT 0,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT usuarios_pk PRIMARY KEY (id),
    CONSTRAINT correo UNIQUE (correo),
    CONSTRAINT usuario UNIQUE (usuario)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.usuarios
    OWNER to postgres;

COMMENT ON TABLE public.usuarios
    IS 'Tabla donde se almacenan los usuarios de la base de datos';


-- ****************************************************
-- CREACION DE TABLA DE CONSULTAS
-- ****************************************************

CREATE TABLE IF NOT EXISTS public.consultas
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    enlace character varying(255)  NOT NULL,
    consulta character varying(1000)  NOT NULL,
    mejora character varying(1000) NOT NULL,
    etapa character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    usuario bigint,
    llamado character varying(255),
    ocid character varying(255) NOT NULL,
    entidad character varying(255) NOT NULL,
    estado character varying(255) NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT consultas_pk PRIMARY KEY (id),
    CONSTRAINT consultas_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.consultas
    OWNER to postgres;

COMMENT ON TABLE public.consultas
    IS 'Tabla donde se almacenan las consultas realizadas por los usuarios';

-- ****************************************************
-- CREACION DE TABLA DE RECLAMOS
-- ****************************************************

CREATE TABLE IF NOT EXISTS public.reclamos
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    enlace character varying(255)  NOT NULL,
    reclamo character varying(1000)  NOT NULL,
    afeccion character varying(1000) NOT NULL,
    etapa character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    usuario bigint,
    llamado character varying(255) NOT NULL,
    ocid character varying(255) NOT NULL,
    entidad character varying(255) NOT NULL,
    estado character varying(255),
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT reclamos_pk PRIMARY KEY (id),
    CONSTRAINT reclamos_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reclamos
    OWNER to postgres;

COMMENT ON TABLE public.reclamos
    IS 'Tabla donde se almacenan los reclamos realizados por los usuarios';

-- ****************************************************
-- CREACION DE TABLA DE CAMPOS DE PREGUNTAS
-- ****************************************************

CREATE TABLE IF NOT EXISTS public.campos
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    nombre character varying(255)  NOT NULL,
    titulo character varying(255)  NOT NULL,
    tipo character varying(255)  NOT NULL,
    grupo character varying(255)  NOT NULL,
    estado character varying(255),
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT campos_pk PRIMARY KEY (id),
    CONSTRAINT nombre UNIQUE (nombre)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.campos
    OWNER to postgres;

COMMENT ON TABLE public.campos
    IS 'Tabla donde se almacenan los campos de un formulario';




-- ****************************************************
-- CREACION DE TABLA DE RESPUESTAS A LAS PREGUNTAS
-- ****************************************************


CREATE TABLE IF NOT EXISTS public.respuestas_campos
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    nombre_campo character varying(255)  NOT NULL,
    respuesta character varying(1000)  NOT NULL,
    id_reclamo bigint NOT NULL,
    estado character varying(255),
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT respuestas_campos_pk PRIMARY KEY (id),
    CONSTRAINT id_reclamo_fk FOREIGN KEY (id_reclamo) REFERENCES reclamos(id),
    CONSTRAINT nombre_campo_fk FOREIGN KEY (nombre_campo) REFERENCES campos(nombre)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.respuestas_campos
    OWNER to postgres;

COMMENT ON TABLE public.campos
    IS 'Tabla donde se almacenan las respuestas de los campos de un formuario';



-- ****************************************************
-- CREACION DE TABLA DE CONFIGURACION DE OPORTUNIDADES
-- ****************************************************

CREATE TABLE IF NOT EXISTS public.oportunidades
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    ruc character varying(255)  NULL,
    categorias_nivel1 text NULL,
    categorias_nivel5 text NULL,
    categorias text NULL,
    palabras_clave text NULL,
    rango_formalizacion character varying(255) NULL,
    rango_experiencia character varying(255) NULL,
    estado character varying(255)  NOT NULL,
    usuario bigint NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT oportunidades_pk PRIMARY KEY (id),
    CONSTRAINT usuario_oportunidades UNIQUE (usuario),
    CONSTRAINT oportunidades_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.oportunidades
    OWNER to postgres;

COMMENT ON TABLE public.oportunidades
    IS 'Tabla donde se almacena la informacion de oportunidades de los usuarios';


-- ****************************************************
-- CREACION DE TABLA DE LIKES A LLAMADOS
-- ****************************************************


    CREATE TABLE IF NOT EXISTS public.me_gusta
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    llamado character varying(255) NOT NULL,
    ocid character varying(255) NOT NULL,
    usuario bigint NOT NULL,
    estado character varying(255)  NOT NULL,
    titulo text NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT me_gusta_pk PRIMARY KEY (id),
    CONSTRAINT usuario_llamado_me_gusta UNIQUE (usuario,llamado),
    CONSTRAINT me_gusta_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.me_gusta
    OWNER to postgres;

COMMENT ON TABLE public.me_gusta
    IS 'Tabla donde se almacena la informacion de los me gusta a los procesos de contratacion';


-- ****************************************************
-- CREACION DE TABLA DE ESTADOS DE SOLICITUDES
-- ****************************************************


    CREATE TABLE IF NOT EXISTS public.tareas
(
    nombre character varying(255) NOT NULL,
    descripcion character varying(255) NOT NULL,
    encargado character varying(255) NOT NULL,
    grupo character varying(255) NOT NULL,
    defecto character varying(255) NOT NULL,
    estado character varying(255)  NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT tareas_pk PRIMARY KEY (nombre)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tareas
    OWNER to postgres;

COMMENT ON TABLE public.tareas
    IS 'Tabla donde se almacena las tareas por las que puede pasar una solicitud';


-- ****************************************************
-- CREACION DE TABLA DE TWEETS
-- ****************************************************

    CREATE TABLE IF NOT EXISTS public.tweets
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    id_tweet character varying(255) NOT NULL,
    tweet text NOT NULL,
    id_reclamo_consulta character varying(255) NOT NULL,
    tipo_solicitud character varying(255) NOT NULL,
    usuario bigint  NOT NULL,
    estado character varying(255)  NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT tweets_pk PRIMARY KEY (id),
    CONSTRAINT tweets_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tweets
    OWNER to postgres;

COMMENT ON TABLE public.tweets
    IS 'Tabla donde se almacenan los tweets de protetas sobre los llamados';

-- ****************************************************
-- CREACION DE TABLA DE ROLES DE USUARIOS
-- ****************************************************


    CREATE TABLE IF NOT EXISTS public.roles
(
    nombre character varying(255) NOT NULL,
    descripcion character varying(500) NOT NULL,
    estado character varying(255)  NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT roles_pk PRIMARY KEY (nombre)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;

COMMENT ON TABLE public.roles
    IS 'Tabla donde se almacena la descripcion de los roles del sitio';

-- ****************************************************
-- CREACION DE TABLA DE RELACION DE ROLES  CON LOS USUARIOS
-- ****************************************************

    CREATE TABLE IF NOT EXISTS public.roles_usuarios
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    rol character varying(255) NOT NULL,
    usuario bigint  NOT NULL,
    estado character varying(255)  NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT roles_usuarios_pk PRIMARY KEY (id),
    CONSTRAINT rol_fk FOREIGN KEY (rol) REFERENCES roles(nombre),
    CONSTRAINT roles_usuarios_unique UNIQUE (rol,usuario),
    CONSTRAINT roles_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles_usuarios
    OWNER to postgres;

COMMENT ON TABLE public.roles_usuarios
    IS 'Tabla donde se almacena la relacion de usuarios y roles';




-- ****************************************************
-- CREACION DE TABLA DE HISTORIAL DE ESTADOS DE LOS RECLAMOS
-- ****************************************************


    CREATE TABLE IF NOT EXISTS public.bitacora_reclamos_estados
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    id_reclamo bigint NOT NULL,
    tarea character varying(255) NOT NULL,
    justificacion text NULL,
    grupo_encargado character varying(500) NULL,
    usuario_encargado character varying(255) NULL,
    estado character varying(255)  NOT NULL,
    fecha_visualizacion timestamptz,
    fecha_modificacion timestamptz,
    fecha_finalizacion timestamptz NULL,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT bitacora_reclamos_estados_pk PRIMARY KEY (id),
    CONSTRAINT tarea_fk FOREIGN KEY (tarea) REFERENCES tareas(nombre),
    CONSTRAINT id_reclamo_fk FOREIGN KEY (id_reclamo) REFERENCES reclamos(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.bitacora_reclamos_estados
    OWNER to postgres;

COMMENT ON TABLE public.bitacora_reclamos_estados
    IS 'Tabla donde se almacena la bitacora y asignacion de tareas por las que puede pasar un reclamo';


-- ****************************************************
-- CREACION DE TABLA DE HISTORIAL DE ESTADOS DE LAS CONSULTAS
-- ****************************************************

    CREATE TABLE IF NOT EXISTS public.bitacora_consultas_estados
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    id_consulta bigint NOT NULL,
    tarea character varying(255) NOT NULL,
    justificacion text NULL,
    grupo_encargado character varying(500) NULL,
    usuario_encargado character varying(255) NULL,
    estado character varying(255)  NOT NULL,
    fecha_visualizacion timestamptz,
    fecha_modificacion timestamptz,
    fecha_finalizacion timestamptz NULL,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT bitacora_consultas_estados_pk PRIMARY KEY (id),
    CONSTRAINT tarea_fk FOREIGN KEY (tarea) REFERENCES tareas(nombre),
    CONSTRAINT id_consulta_fk FOREIGN KEY (id_consulta) REFERENCES consultas(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.bitacora_consultas_estados
    OWNER to postgres;

COMMENT ON TABLE public.bitacora_consultas_estados
    IS 'Tabla donde se almacena la bitacora y asignacion de tareas por las que puede pasar una consulta';



-- ****************************************************
-- CREACION DE TABLA DE CORREOS
-- ****************************************************

    CREATE TABLE IF NOT EXISTS public.correos
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),

    mensaje text NOT NULL,
    asunto text NOT NULL,
    de text NOT NULL,
    para text NOT NULL,
    cc text NULL,
    cco text NULL,
    id_reclamo_consulta character varying(255) NULL,
    tipo_solicitud character varying(255) NULL,
    usuario bigint  NULL,
    tipo_correo character varying(255)  NOT NULL,
    llamado character varying(255),
    ocid character varying(255),
    estado character varying(255)  NOT NULL,
    fecha_modificacion timestamptz,
    fecha_creacion timestamptz NOT NULL,
    CONSTRAINT correos_pk PRIMARY KEY (id),
    CONSTRAINT correos_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.correos
    OWNER to postgres;

COMMENT ON TABLE public.correos
    IS 'Tabla donde se almacenan los correos enviados sobre los llamados';



-- ****************************************************
-- CREACION DE TABLA DE LOGEOS
-- ****************************************************

    CREATE TABLE IF NOT EXISTS public.logeos
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    usuario bigint  NOT NULL,
    fecha_inicio timestamptz NOT NULL,
    fecha_finalizacion timestamptz NULL,
    CONSTRAINT logeos_usuario_fk FOREIGN KEY (usuario) REFERENCES usuarios(id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.logeos
    OWNER to postgres;

COMMENT ON TABLE public.logeos
    IS 'Tabla donde se almacenan los logeos de los usuarios';