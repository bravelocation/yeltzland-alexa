'use strict';
var request = require("request");
var dateFormat = require('dateformat');
var AmazonDateParser = require('amazon-date-parser');

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


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    callback({}, buildSpeechletResponse('Welcome', 'Welcome to Yeltzland. What do you want to know about the mighty Yeltz?', null, false));
}

function handleSessionEndRequest(callback) {
    callback({}, buildSpeechletResponse('Session Ended', 'Thanks for coming', null, true));
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
    const teamSlot = intent.slots.Team;
    let speechOutput = "";
    let repromptText = null;
    var team = "";
    if (teamSlot) {
        team = teamSlot.value;
    }

    const cardTitle = "Halesowen games against " + team;

    getJSON("https://bravelocation.com/automation/feeds/matches.json", function(err, data) {
            if (err != null) {
                speechOutput = "I'm sorry I couldn't find that out right now";
                repromptText = "Please try again later";
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

            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
        });
}


/**
 * Time functions
 */
function timeBasedData(intent, session, callback) {
    let speechOutput = "";
    let repromptText = null;
    const cardTitle = "Halesowen games";
    
    var timeSlot = intent.slots.date.value;
    var timeStart = null;
    var timeEnd = null;
    
    if (timeSlot) {
        var eventDate = new AmazonDateParser(timeSlot);
        timeStart = eventDate.startDate;
        timeEnd = eventDate.endDate;
    }

    if (timeStart == null || timeEnd == null) {
        callback({}, buildSpeechletResponse(cardTitle, "No games found on that day", repromptText, true));
        return;
    }

 
    getJSON("https://bravelocation.com/automation/feeds/matches.json", function(err, data) {
            if (err != null) {
                speechOutput = "I'm sorry I couldn't find that out right now";
                repromptText = "Please try again later";
            } else {
                var matches = [];

                // Go through each of the matches
                for (var i = 0; i < data.Matches.length; i++) {
                    var match = data.Matches[i];      

                    var matchDate = Date.parse(match.MatchDateTime);
                    
                    if (matchDate >= timeStart && matchDate <= timeEnd) {
                        matches.push(match);
                    }                
                }

                if (matches.length == 0) {
                    speechOutput = "No games found on that day";
                } else {
                    speechOutput = matchesToSpeech(matches);
                }
            }

            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
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

        output += match.Opponent + (match.Home == "0" ? " away " : " at home ") + "on " + speakDate(match.MatchDateTime); 

        if (!fixture) {
            if (match.TeamScore > match.OpponentScore) {
                output += ". We won " + speakScore(match.TeamScore) + " " + speakScore(match.OpponentScore);
            } else if (match.TeamScore == match.OpponentScore) {
                output += ". We drew " + speakScore(match.TeamScore) + " " + speakScore(match.OpponentScore);
            } else {
                output += ". We lost " + speakScore(match.OpponentScore) + " " + speakScore(match.TeamScore);
            } 
            
        } else {
            output += " at " + speakTime(match.MatchDateTime);
        }  
        
        output += ". ";       
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

function speakTime(dateString) {
    var parsedDate = parseDate(dateString);
    var hours = parsedDate.getHours();
    var minutes = parsedDate.getMinutes();
    
    if (hours > 12) {
        hours -= 12;
    }

    if (minutes == 0) {
        return hours.toString() + " o'clock";
    } else {
        return hours.toString() + " " + minutes.toString();        
    }
}

function parseDate(dateString) {
    var dateStringParts = dateString.split(' ');
    var dayParts = dateStringParts[0].split('-');
    var timeParts = dateStringParts[1].split(':');
    
    return new Date(dayParts[0],dayParts[1] - 1,dayParts[2],timeParts[0],timeParts[1],timeParts[2]);
}

function gameScore(intent, session, callback) {
    let speechOutput = "";
    let repromptText = null;

    getJSON("https://bravelocation.com/automation/feeds/gamescore.json", function(err, data) {
        if (err != null) {
            speechOutput = "I'm sorry I couldn't find that out right now";
            repromptText = "Please try again later";
        } else {
            var opponent = data.match.Opponent;
            var home = (data.match.Home == "1");
            var yeltzScore = data.yeltzScore || 0;
            var opponentScore = data.opponentScore || 0;

            speechOutput = "The latest score is ";

            if (home) {
                speechOutput += "Halesowen Town " + yeltzScore + ", " + opponent + " " + opponentScore;
            } else {
                speechOutput += opponent + " " + opponentScore + ", Halesowen Town " + yeltzScore;               
            }
        }

        callback({}, buildSpeechletResponse("Latest score", speechOutput, repromptText, true));
       });
    }

function bestTeam(intent, session, callback) {
    callback({}, buildSpeechletMarkupResponse("Who's the best team?", '<speak><p><emphasis level="strong">Halesowen Town</emphasis></p><p><emphasis level="strong">Halesowen Town F C</emphasis></p><p><emphasis level="strong">They\'re by far the greatest team</emphasis></p><p><emphasis level="strong">The world has ever seen</emphasis></p></speak>', "The best team are Halesowen Town", true));
}

function worstTeam(intent, session, callback) {
    callback({}, buildSpeechletMarkupResponse("Who's the worst team?", '<speak>The worst team are Stour <say-as interpret-as="expletive">bridge</say-as> Town</speak>', "The worst team are Stourbridge Town", true));
}


function singleGame(intent, session, callback) {
    let cardTitle = "";
    let speechOutput = "";
    let repromptText = null;

    getJSON("https://bravelocation.com/automation/feeds/matches.json", function(err, data) {
            if (err != null) {
                speechOutput = "I'm sorry I couldn't find that out right now";
                repromptText = "Please try again later";
            } else {
                var nextGame = null;
                var lastGame = null;
                var timeGame = null;
                
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
                    cardTitle = "Next game";
                    if (nextGame == null) {
                        speechOutput = "No more fixtures found";
                    } else {
                        matches.push(nextGame);
                        speechOutput = matchesToSpeech(matches);
                    }
                } else if (intent.name == "LastResultIntent") {
                    cardTitle = "Last game";
                    if (lastGame == null) {
                        speechOutput = "No more games found";
                    } else {
                        matches.push(lastGame);
                        speechOutput = matchesToSpeech(matches);
                    }
                }
            }

            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
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
