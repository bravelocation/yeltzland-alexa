'use strict';
var request = require("request");
var dateFormat = require('dateformat');

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `Yeltzland - ${title}`,
            content: `Yeltzland - ${output}`,
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

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Yeltzland. What do you want to know about the mighty Yeltz?';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Try something like when do we play Workington?';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying Yeltzland';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 *  Data functions
 */

var getJSON = function(url, callback) {
    request({
    url: url,
    json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                callback(null, body);
            } else {
                callback(error, null);
            }
        })
};

/**
 * Team functions
 */
function teamBasedData(intent, session, callback) {
    const cardTitle = intent.name;
    const teamSlot = intent.slots.Team;
    let sessionAttributes = {};
    let speechOutput = "";
    var team = "";
    if (teamSlot) {
        team = teamSlot.value;
    }

    getJSON("https://bravelocation.com/automation/feeds/matches.json", function(err, data) {
            if (err != null) {
                speechOutput = "I'm sorry I couldn't find that out right now";
            } else {
                var fixtures = [];
                var results = [];

                // Go through each of the matches
                for (var i = 0; i < data.Matches.length; i++) {
                    var match = data.Matches[i];      
                    
                    if (match.Opponent == team) {
                        if ((match.TeamScore == null) || (match.OpponentScore == null)) {
                            fixtures.push(match);
                        } else {
                            results.push(match);
                        }
                    }                
                }

                if (intent.name == "FixtureIntent") {
                    if (fixtures.length == 0) {
                        speechOutput = "No more fixtures found against " + team;
                    } else {
                        speechOutput = matchesToSpeech(fixtures);
                    }
                } else if (intent.name == "ResultIntent") {
                    if (results.length == 0) {
                        speechOutput = "No results found against " + team;
                    } else {
                        speechOutput = matchesToSpeech(results);
                    }
                }
            }

            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, null, false));
        });
}

function matchesToSpeech(matches) {
    var output = "";

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        var fixture = (match.TeamScore == null) || (match.OpponentScore == null);  
        
        output += "We ";
        if (fixture) {
            output += "will " + (i > 0 ? "also " : "") + "play "
        } else {
            output += (i > 0 ? "also " : "") + "played ";
        }

        output += match.Opponent + (match.Home == "0" ? " away " : " at home ") + "on " + speakDate(match.MatchDateTime) + ". "; 

        if (!fixture) {
            if (match.TeamScore > match.OpponentScore) {
                output += "We won " + speakScore(match.TeamScore) + " " + speakScore(match.OpponentScore);
            } else if (match.TeamScore == match.OpponentScore) {
                output += "We drew " + speakScore(match.TeamScore) + " " + speakScore(match.OpponentScore);
            } else {
                output += "We lost " + speakScore(match.OpponentScore) + " " + speakScore(match.TeamScore);
            } 
            
            output += ". "
        }                      
    }  

    return output;
}

function speakScore(score) {
    if (score == 0) {
        return "nil";
    }

    return score.toString();
}

function speakDate(dateString) {
    return dateFormat(parseDate(dateString), "dddd, mmmm dS, yyyy");
}

function parseDate(dateString) {
    var dateStringParts = dateString.split(' ');
    var dayParts = dateStringParts[0].split('-');
    var timeParts = dateStringParts[1].split(':');
    
    return new Date(dayParts[0],dayParts[1] - 1,dayParts[2],timeParts[0],timeParts[1],timeParts[2]);
}

function gameScore(intent, session, callback) {
    const sessionAttributes = {};
    var speechOutput = "";

    getJSON("https://bravelocation.com/automation/feeds/gamescore.json", function(err, data) {
        if (err != null) {
            speechOutput = "I'm sorry I couldn't find that out right now";
        } else {
            var opponent = data.match.Opponent;
            var home = (data.match.Home == "1");
            var yeltzScore = data.yeltzScore || 0;
            var opponentScore = data.opponentScore || 0;

            speechOutput = "The latest score is ";

            if (home) {
                speechOutput += "Halesowen Town " + yeltzScore + ", " + opponent + " " + opponentScore;
            } else {
                speechOutput += opponent + " " + opponentScorev + ", Halesowen Town " + yeltzScore;               
            }
        }

        callback(sessionAttributes, buildSpeechletResponse(intent.name, speechOutput, null, false));
       });
    }

function bestTeam(intent, session, callback) {
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = 'The best team is Halesowen Town';

    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function worstTeam(intent, session, callback) {
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = 'The worst team are Stourbridge Town';

    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


function singleGame(intent, session, callback) {
    const cardTitle = intent.name;
    let sessionAttributes = {};
    let speechOutput = "";

    getJSON("https://bravelocation.com/automation/feeds/matches.json", function(err, data) {
            if (err != null) {
                speechOutput = "I'm sorry I couldn't find that out right now";
            } else {
                var nextGame = null;
                var lastGame = null;

                // Go through each of the matches
                for (var i = 0; i < data.Matches.length; i++) {
                    var match = data.Matches[i];      
                    
                    if ((match.TeamScore == null) || (match.OpponentScore == null)) {
                        if (nextGame == null) {
                            nextGame = match;
                        }
                    } else {
                        lastGame = match;
                    }  
                }          

                var matches = [];

                if (intent.name == "NextGameIntent") {
                    if (nextGame == null) {
                        speechOutput = "No more fixtures found";
                    } else {
                        matches.push(nextGame);
                        speechOutput = matchesToSpeech(matches);
                    }
                } else if (intent.name == "LastResultIntent") {
                    if (lastGame == null) {
                        speechOutput = "No more games found";
                    } else {
                        matches.push(lastGame);
                        speechOutput = matchesToSpeech(matches);
                    }
                }
            }

            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, null, false));
        });
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

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

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
