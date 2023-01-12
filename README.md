# A. Requisitos
## 1. Tener [NodeJs](https://nodejs.org/es/) Intalado preferible 16 <

## 2. Instalar Serverless Framework
```sh
npm install serverless -g
```
## 3. Instalar las dependencias
```sh
npm install 
```
## 4. Crear un usuario IAM en la consola de AWS con los permisos suficientes para utilizar los siguientes servicios:
> CloudWatch, EventBridge, Lambda, Api Gateway, CloudFormation, Amplify, Cognito, SES o bien un usuario IAM con la politica de servicios de AdministratorAccess

### Se debe crear una cuenta en la [consola de AWS](https://aws.amazon.com/es/)

1. Ingresar al servicio IAM
2. Ingresar Administración del acceso > Usuarios > Agregar Usuario
3. Ingresar el nombre de Usuario y marcar la casilla Clave de acceso: acceso mediante programación
4. Asociar la politica por ejemplo  (AdministratorAccess) y Finalizar descargando el archivo CSV con las credenciales.

## 5. Crear una base de datos PostgreSQL
> Se puede  tomar como referencia  el archivo docker-compose.yml ubicado en la carpeta **db_docker**

Definir la base de datos con los scripts que se encuentran en la carpeta **queries_ddl**  
Ejecutandolos en el orden númerico

# B. Despliegue

## 1. Variables de entorno
### I. Crear el Archivo .env 
```sh
touch .env
```
### II. Definir las siguientes variables de entorno requeridas:
```sh
# Entorno
NODE_ENV=dev

# Credenciales de desarrollador para las publicaciones de twitter
TWITTER_API_KEY=""
TWITTER_API_KEY_SECRET=""
TWITTER_ACCESS_TOKEN=""
TWITTER_ACCESS_TOKEN_SECRET=""

# Credenciales y Conexion a la base de datos PostgreSQL
PGDATABASE=""
PGHOST=""
PGPASSWORD=""
PGPORT=""
PGUSER=""

# Request token de la API de la DNCP, solicitado en https://www.contrataciones.gov.py/datos/adm/signup
REQUEST_TOKEN_API_DNCP=""

# DSN de sentry para logs y notificaciones
SENTRY_DSN=""

# Cliente y Pool de Usuarios de Cognito para validacion de Tokens
COGNITO_CLIENT_ID=""
COGNITO_USER_POOL_ID=""

# Credenciales de Usuario para envio de correos
EMAIL_FROM=""
EMAIL_PASS=""

# Url del Frontend
FRONTEND_URL=""
```

## 2. Puesta en marcha
Especificar como variables de entorno las credenciales del usuario IAM (AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY) y pasar como agumento el stage y la region mas optima para los servicios, se desplagaran todos los endpoints, y se listaran todas las url para su consumo.
## Linux:
```sh
env AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID> AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY> sls deploy --stage dev --region sa-east-1
```

## Windows:
```sh
set AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>&&set AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>&& sls deploy --stage dev --region sa-east-1
```

## 2.1 Obtener la API-KEY
A la hora de iniciar el despliege por primera vez se creara la API KEY apareciendo en la consola, configurada con los parametros del plan de uso asociados en el archivo serverless.yml, la cual debemos anotar o verificar posteriormente en el servicio API Gateway en la consola de AWS, para agregarla como parametro en la variable de entorno NEXT_PUBLIC_API_KEY en el frontend

```sh
AddApiKey: ApiKeyVigiA - <API_KEY>
```


