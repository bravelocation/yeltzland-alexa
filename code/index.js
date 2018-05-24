'use strict';
var AmazonDateParser = require('amazon-date-parser');
var yeltzlandSpeech = require("./yeltzland-speech").yeltzlandSpeech;

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Standard',
            title: `Yeltzland - ${title}`,
            text: `${output}`,
            image: {
                "smallImageUrl": "https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_large.png",
                "largeImageUrl": "https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_large.png"
            }
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildSpeechletMarkupResponse(title, outputMarkup, cardContent, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'SSML',
            ssml: outputMarkup,
        },
        card: {
            type: 'Simple',
            title: `Yeltzland - ${title}`,
            content: `${cardContent}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: null,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'BestTeamIntent') {
        bestTeam(intent, session, callback);
    } else if (intentName === 'WorstTeamIntent') {
        worstTeam(intent, session, callback);
    } else if (intentName === 'FixtureIntent') {
        teamBasedData(intent, session, callback);
    } else if (intentName === 'ResultIntent') {
        teamBasedData(intent, session, callback);
    } else if (intentName === 'NextGameIntent') {
        singleGame(intent, session, callback);
    } else if (intentName === 'LastResultIntent') {
        singleGame(intent, session, callback);
    } else if (intentName === 'GameTimeIntent') {
        timeBasedData(intent, session, callback);
    } else if (intentName === 'GameScoreIntent') {
        gameScore(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};


// ------ Intent functions -----

function getWelcomeResponse(callback) {
    callback({}, buildSpeechletResponse('Welcome', yeltzlandSpeech.welcomeText, null, false));
}

function handleSessionEndRequest(callback) {
    callback({}, buildSpeechletResponse('Session Ended', yeltzlandSpeech.finishText, null, true));
}

function teamBasedData(intent, session, callback) {
    // Pick up the team value from the slot
    const teamSlot = intent.slots.Team;
    var team = "";
    if (teamSlot) {
        team = teamSlot.value;
    }

    const cardTitle = "Halesowen games against " + team;

    var useFixtures = (intent.name == "FixtureIntent");
    yeltzlandSpeech.teamBased(useFixtures, team, function(result) {
        callback({}, buildSpeechletResponse(cardTitle, result.speechOutput, result.repromptText, true));
    });
}

function timeBasedData(intent, session, callback) {   
    // Pick up the time start and end requested
    var timeSlot = intent.slots.date.value;
    var timeStart = null;
    var timeEnd = null;
    
    if (timeSlot) {
        var eventDate = new AmazonDateParser(timeSlot);
        timeStart = eventDate.startDate;
        timeEnd = eventDate.endDate;
    }

    const cardTitle = "Halesowen games";
    if (timeStart == null || timeEnd == null) {
        callback({}, buildSpeechletResponse(cardTitle, "No games found on that day", null, true));
    } else {
        yeltzlandSpeech.timeBased(timeStart, timeEnd, function(result) {
            callback({}, buildSpeechletResponse(cardTitle, result.speechOutput, result.repromptText, true));
        });
    }
}

function bestTeam(intent, session, callback) {
    callback({}, buildSpeechletMarkupResponse("Who's the best team?", yeltzlandSpeech.bestTeamSpeak, "The best team are Halesowen Town", true));
}

function worstTeam(intent, session, callback) {
    callback({}, buildSpeechletMarkupResponse("Who's the worst team?", yeltzlandSpeech.worstTeamSpeak, "The worst team are Stourbridge Town", true));
}

function singleGame(intent, session, callback) {
    var useFixtures = (intent.name == "NextGameIntent");

    yeltzlandSpeech.singleGame(useFixtures, function(result) {
        callback({}, buildSpeechletResponse(result.cardTitle, result.speechOutput, result.repromptText, true));
    });
}

function gameScore(intent, session, callback) {
    yeltzlandSpeech.gameScore(function(result) {
        callback({}, buildSpeechletResponse("Latest score", result.speechOutput, result.repromptText, true));
    });
}
