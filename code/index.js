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
        return helper.cardWithReprompt(handlerInput, yeltzlandSpeech.welcomeTitle, yeltzlandSpeech.welcomeText);
    }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
      return helper.card(handlerInput, yeltzlandSpeech.welcomeTitle, yeltzlandSpeech.welcomeText);
  }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return helper.card(handlerInput, yeltzlandSpeech.finishTitle, yeltzlandSpeech.finishText);
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
      
        return helper.speakWithReprompt(handlerInput, yeltzlandSpeech.errorText);
    },
};

/* App-specific helpers */
const BestTeamIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'BestTeamIntent';
    },
    handle(handlerInput) {
        return helper.cardWithSpeech(handlerInput, yeltzlandSpeech.bestTeamTitle, yeltzlandSpeech.bestTeamSpeak, yeltzlandSpeech.bestTeamText);
    }
};

const WorstTeamIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'WorstTeamIntent';
    },
    handle(handlerInput) {
        const imageUrl = yeltzlandSpeech.teamImageUrl("Stourbridge");
        return helper.cardWithSpeechAndImages(handlerInput, yeltzlandSpeech.worstTeamTitle, yeltzlandSpeech.worstTeamSpeak, yeltzlandSpeech.worstTeamText, imageUrl, imageUrl);
    }
};

const TeamBasedIntentHandler = {
    canHandle(handlerInput) {
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

        const cardTitle = yeltzlandSpeech.gamesTitlePrefix + yeltzlandSpeech.titleCase(team);
        const useFixtures = (handlerInput.requestEnvelope.request.intent.name == "FixtureIntent");
        const result = await yeltzlandSpeech.teamBased(useFixtures, team);
        const imageUrl = yeltzlandSpeech.teamImageUrl(team);

        return helper.cardWithSpeechAndImages(handlerInput, cardTitle, result.speechOutput, result.textOutput, imageUrl, imageUrl);
    }
};

const TimeBasedIntentHandler = {
    canHandle(handlerInput) {
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

        if (timeStart == null || timeEnd == null) {
            return helper.card(handlerInput, yeltzlandSpeech.halesowenGamesTitle, yeltzlandSpeech.noGamesFound);
        } else {
            const result = await yeltzlandSpeech.timeBased(timeStart, timeEnd);

            if (result.matches && result.matches.length > 0) {
                const imageUrl = yeltzlandSpeech.teamImageUrl(result.matches[0].Opponent);
                return helper.cardWithSpeechAndImages(handlerInput, yeltzlandSpeech.halesowenGamesTitle, result.speechOutput, result.textOutput, imageUrl, imageUrl);
            }

            return helper.cardWithSpeech(handlerInput, yeltzlandSpeech.halesowenGamesTitle, result.speechOutput, result.textOutput);
        }
    }
};

const SingleGameIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'NextGameIntent' || handlerInput.requestEnvelope.request.intent.name === 'LastResultIntent');
    },
    async handle(handlerInput) {
        var useFixtures = (handlerInput.requestEnvelope.request.intent.name == "NextGameIntent");

        const result = await yeltzlandSpeech.singleGame(useFixtures);

        if (result.matches && result.matches.length > 0) {
            const imageUrl = yeltzlandSpeech.teamImageUrl(result.matches[0].Opponent);
            return helper.cardWithSpeechAndImages(handlerInput, result.cardTitle, result.speechOutput, result.textOutput, imageUrl, imageUrl);
        }

        return helper.cardWithSpeech(handlerInput, result.cardTitle, result.speechOutput, result.textOutput);
    }
};

const GameScoreIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'GameScoreIntent';
    },
    async handle(handlerInput) {
        const result = await yeltzlandSpeech.gameScore();

        if (result.matches && result.matches.length > 0) {
            const imageUrl = yeltzlandSpeech.teamImageUrl(result.matches[0].Opponent);
            return helper.cardWithSpeechAndImages(handlerInput, yeltzlandSpeech.latestScoreTitle, result.speechOutput, result.textOutput, imageUrl, imageUrl);
        }

        return helper.cardWithSpeech(handlerInput, yeltzlandSpeech.latestScoreTitle, result.speechOutput, result.textOutput);
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
