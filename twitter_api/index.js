const { TwitterApi } = require("twitter-api-v2");


const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_KEY_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

async function createTweetOnAPI(tweetText) {
  let tweet = { id: "", text: "" };
  try {
    const response = await client.readWrite.v2.tweet(tweetText);
    if (response.errors) {
      throw response.errors;
    }
    if (!response.data) {
      throw new Error("Tweet not created");
    }
    tweet = response.data;
  } catch (e) {
    throw e;
  }
  return tweet;
}

async function deleteTweetOnAPI(tweetId) {
  let tweet = { deleted: false };
  try {
    const response = await client.readWrite.v2.deleteTweet(tweetId);
    if (response.errors) {
      throw response.errors;
    }
    
    if (!response.data) {
      throw new Error("Tweet not deleted");
    }
    tweet = response.data;
    if(!tweet.deleted){
      throw new Error("Tweet not deleted");
    }
  } catch (e) {
    throw e;
  }
  return tweet;
}

module.exports = {
  createTweetOnAPI,
  deleteTweetOnAPI
};
