"use strict";
require("dotenv").config();
const claims = require("./controllers/claims");
const questions = require("./controllers/questions");
const opportunities = require("./controllers/opportunities");
const users = require("./controllers/users");
const dncp = require("./controllers/dncp");
const etl = require("./controllers/etl");
const likes = require("./controllers/likes");
const uoc = require("./controllers/uoc");
const twitter = require("./controllers/twitter");
const report = require("./controllers/report");
const admin = require("./controllers/admin");
const mails = require("./controllers/mails");
const stats=require("./controllers/stats")

const etlLambda= require("./controllers/etlLambda");


/**Usuarios */
module.exports.signUpUser = users.signUpUser;
module.exports.signUpUserConfirm = users.signUpUserConfirm;
module.exports.getUserRoles = users.getUserRoles;
module.exports.getUsers = users.getUsers;
module.exports.getUser = users.getUser;
module.exports.updateRoles = users.updateRoles;
module.exports.getRoles = users.getRoles;
module.exports.setLogin = users.setLogin;
module.exports.setLogout = users.setLogout;
module.exports.setNotifications=users.setNotifications;
/**Reclamos */
module.exports.getClaimsExtraFields = claims.getClaimsExtraFields;
module.exports.addClaim = claims.addClaim;
module.exports.getClaim = claims.getClaim;
module.exports.getMyClaims = claims.getMyClaims;
module.exports.getClaimsAgent = claims.getClaimsAgent;
module.exports.getCountClaimsAgent = claims.getCountClaimsAgent;
module.exports.addClaimStatus = claims.addClaimStatus;
module.exports.getTasksClaims = claims.getTasksClaims;
module.exports.updateClaimStatusVisualization = claims.updateClaimStatusVisualization;
/**Consultas */
module.exports.addQuestion = questions.addQuestion;
module.exports.getMyQuestions = questions.getMyQuestions;
module.exports.getQuestion = questions.getQuestion;
module.exports.getQuestionsAgent = questions.getQuestionsAgent;
module.exports.getCountQuestionsAgent = questions.getCountQuestionsAgent;
module.exports.addQuestionStatus = questions.addQuestionStatus;
module.exports.getTasksQuestions = questions.getTasksQuestions;
module.exports.updateQuestionStatusVisualization = questions.updateQuestionStatusVisualization;
/**Oportunidades */
module.exports.addOpportunitiesConfig = opportunities.addOpportunitiesConfig;
module.exports.getOpportunitiesConfig = opportunities.getOpportunitiesConfig;
module.exports.getOpportunities = opportunities.getOpportunities;
module.exports.saveSearchOpportunities = opportunities.saveSearchOpportunities;
/*DNCP */
module.exports.getProcessDNCP = dncp.getProcessDNCP;
module.exports.getSlugDNCP= dncp.getSlugDNCP;
module.exports.getProcessDNCPOCID = dncp.getProcessDNCPOCID;
module.exports.checkProcessDNCP = dncp.checkProcessDNCP;
module.exports.getProcuringEntities = dncp.getProcuringEntities;
module.exports.searchProcessDNCP = dncp.searchProcessDNCP;
module.exports.getPartyProcessesDNCP = dncp.getPartyProcessesDNCP;
module.exports.getProcuringEntitiesRequests = dncp.getProcuringEntitiesRequests;
module.exports.saveSearch = dncp.saveSearch;
module.exports.saveProcessView = dncp.saveProcessView;
module.exports.checkProcessMIPYME = dncp.checkProcessMIPYME;

/*Likes */
module.exports.addLike = likes.addLike;
module.exports.getLike = likes.getLike;
/*Mis Procesos */
module.exports.getMyProcesses = dncp.getMyProcesses;
module.exports.getMyLikes = likes.getMyLikes;
/*etl */
module.exports.ETLValidProcesses = etl.ETLValidProcesses;

/*Index*/
module.exports.getCountRequestIndex = claims.getCountRequestIndex;
/*UOC */

module.exports.getUOCTasksInfo = uoc.getUOCTasksInfo;
module.exports.getUOCRequests = uoc.getUOCRequests;
module.exports.getUOCContactPoint = uoc.getUOCContactPoint;
/* TWITTER */
module.exports.createTweet = twitter.createTweet;
module.exports.deleteTweet = twitter.deleteTweet;
module.exports.getUsersTweets = twitter.getUsersTweets;
/*Report */

module.exports.getRequestsReport = report.getRequestsReport;
module.exports.getCountRequestReport = report.getCountRequestReport;

/*Admin */
module.exports.getRequestsAdmin = admin.getRequestsAdmin;
module.exports.updateEnabledRequest = admin.updateEnabledRequest;

/*Correos */
module.exports.sendDirectMail = mails.sendDirectMail;

/*Stats*/
module.exports.getCountData = stats.getCountData;

module.exports.ETLLambda = etlLambda.ETLLambda


/*TEST*/
const { Client } = require("pg");
module.exports.testService = async (event) => {
  let result=false;
  let bdError=""
  try{
      const client = new Client();
      await client.connect();
      await client.query(`select trim(' TEST ')`,[]);
      await client.end();
      result=true
      }
      catch(e){
      bdError=e.message;
      result=false;
  } 
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        bdTest:result,
        bdError:bdError,
        input: event
      }
    ),
  };
};
