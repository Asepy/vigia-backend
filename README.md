# Configuracion
Tener NodeJs Intalado
## 1. Instalar Serverless Framework
```sh
npm install serverless -g
```
## 2. Instalar los paquetes
```sh
npm install 
```
## 3. Pasar la configuracion del usuario IAM
```sh
sls config credentials --provider aws --key <ACCESS_KEY_ID> --secret <SECRET_ACCESS_KEY_ID> --profile <USER_NAME>
```
## A. Los deploy se hacen con el comando
```sh
sls deploy --stage dev
```
Usara el archivo config.dev.json, con las variables de entornoelastic search
