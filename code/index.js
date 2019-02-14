const Alexa = require('ask-sdk');
const helper = require('./alexaHelper');
const AmazonDateParser = require('amazon-date-parser');
const yeltzlandSpeech = require("./yeltzland-speech").yeltzlandSpeech;


/* Standard Helpers */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return helper.cardWithReprompt(handlerInput, 'Welcome', yeltzlandSpeech.welcomeText);
    }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
      return helper.card(handlerInput, 'Welcome', yeltzlandSpeech.welcomeText);
  }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return helper.card(handlerInput, 'Thanks for coming', yeltzlandSpeech.finishText);
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      //any cleanup logic goes here
      return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
        if (error) {
            console.log(`Error handled: ${error.message}`);
        }
      
        return helper.speakWithReprompt(handlerInput, 'Something went wrong');
    },
};

/* App-specific helpers */
const BestTeamIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'BestTeamIntent';
    },
    handle(handlerInput) {
        return helper.cardWithSpeech(handlerInput, "Who's the best team?", yeltzlandSpeech.bestTeamSpeak, "The best team are Halesowen Town");
    }
};

const WorstTeamIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'WorstTeamIntent';
    },
    handle(handlerInput) {
        const imageUrl = yeltzlandSpeech.teamImageUrl("Stourbridge");
        return helper.cardWithSpeechAndImages(handlerInput, "Who's the worst team?", yeltzlandSpeech.worstTeamSpeak, "The worst team are Stourbridge Town", imageUrl, imageUrl);
    }
};

const TeamBasedIntentHandler = {
    canHandle(handlerInput) {
        console.log("TeamBasedIntentHandler " + handlerInput.requestEnvelope.request.intent.name);
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'FixtureIntent' || handlerInput.requestEnvelope.request.intent.name === 'ResultIntent');
    },
    async handle(handlerInput) {

        // Pick up the team value from the slot
        const teamSlot = handlerInput.requestEnvelope.request.intent.slots.Team;
        var team = "";
        if (teamSlot) {
            team = teamSlot.value;
        }

        console.log("TeamBasedIntentHandler " + team);

        const cardTitle = "Halesowen games against " + yeltzlandSpeech.titleCase(team);
        const useFixtures = (handlerInput.requestEnvelope.request.intent.name == "FixtureIntent");
        const result = await yeltzlandSpeech.teamBased(useFixtures, team);
        const imageUrl = yeltzlandSpeech.teamImageUrl(team);

        return helper.cardWithSpeechAndImages(handlerInput, cardTitle, result.speechOutput, imageUrl, imageUrl);
    }
};

const TimeBasedIntentHandler = {
    canHandle(handlerInput) {
        console.log("TeamBasedIntentHandler " + handlerInput.requestEnvelope.request.intent.name);
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'GameTimeIntent';
    },
    async handle(handlerInput) {
        // Pick up the time start and end requested
        var timeSlot = handlerInput.requestEnvelope.request.intent.slots.date.value;
        var timeStart = null;
        var timeEnd = null;
        
        if (timeSlot) {
            var eventDate = new AmazonDateParser(timeSlot);
            timeStart = eventDate.startDate;
            timeEnd = eventDate.endDate;
        }

        const cardTitle = "Halesowen games";

        if (timeStart == null || timeEnd == null) {
            return helper.card(handlerInput, cardTitle, "No games found on that day");
        } else {
            const result = await yeltzlandSpeech.timeBased(timeStart, timeEnd);
            return helper.cardWithReprompt(handlerInput, cardTitle, result.speechOutput);
        }
    }
};

const SingleGameIntentHandler = {
    canHandle(handlerInput) {
        console.log("TeamBasedIntentHandler " + handlerInput.requestEnvelope.request.intent.name);
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'NextGameIntent' || handlerInput.requestEnvelope.request.intent.name === 'LastResultIntent');
    },
    async handle(handlerInput) {
        var useFixtures = (handlerInput.requestEnvelope.request.intent.name == "NextGameIntent");

        const result = await yeltzlandSpeech.singleGame(useFixtures);
        return helper.cardWithReprompt(handlerInput, result.cardTitle, result.speechOutput);
    }
};

const GameScoreIntentHandler = {
    canHandle(handlerInput) {
        console.log("TeamBasedIntentHandler " + handlerInput.requestEnvelope.request.intent.name);
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'GameScoreIntent';
    },
    async handle(handlerInput) {
        const result = await yeltzlandSpeech.gameScore();
        return helper.cardWithReprompt(handlerInput, "Latest score", result.speechOutput);
    }
};

/* Setup lambda interface */
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,

    BestTeamIntentHandler,
    WorstTeamIntentHandler,
    TeamBasedIntentHandler,
    TimeBasedIntentHandler,
    SingleGameIntentHandler,
    GameScoreIntentHandler,
    
    ErrorHandler
)
  .addErrorHandlers(ErrorHandler)
  .lambda();
