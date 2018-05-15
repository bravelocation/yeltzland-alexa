'use strict';
var request = require("request");
var dateFormat = require('dateformat');

var yeltzlandSpeech = {};
yeltzlandSpeech.welcomeText = 'Welcome to Yeltzland. What do you want to know about the mighty Yeltz?';
yeltzlandSpeech.finishText = 'Thanks for coming';

yeltzlandSpeech.teamBased = function(useFixtures, team, callback) {

    let speechOutput = "";
    let repromptText = null;

    getMatchesData(function(err, data) {
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

            if (useFixtures) {
                if (fixtures.length == 0) {
                    speechOutput = "No more fixtures found against " + team;
                } else {
                    speechOutput = matchesToSpeech(fixtures);
                }
            } else {
                if (results.length == 0) {
                    speechOutput = "No results found against " + team;
                } else {
                    speechOutput = matchesToSpeech(results);
                }
            }
        }

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText 
        }

        callback(result);
    });
};


yeltzlandSpeech.timeBased = function(timeStart, timeEnd, callback) {
    let speechOutput = "";
    let repromptText = null;

    getMatchesData(function(err, data) {
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

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText 
        }

        callback(result);
    });
};

yeltzlandSpeech.singleGame = function(useFixtures, callback) {
    let cardTitle = "";
    let speechOutput = "";
    let repromptText = null;

    getMatchesData(function(err, data) {
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

            if (useFixtures) {
                cardTitle = "Next game";
                if (nextGame == null) {
                    speechOutput = "No more fixtures found";
                } else {
                    matches.push(nextGame);
                    speechOutput = matchesToSpeech(matches);
                }
            } else {
                cardTitle = "Last game";
                if (lastGame == null) {
                    speechOutput = "No more games found";
                } else {
                    matches.push(lastGame);
                    speechOutput = matchesToSpeech(matches);
                }
            }
        }

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText,
            cardTitle: cardTitle
        }

        callback(result);
    });
}

yeltzlandSpeech.gameScore = function(callback) {
    let speechOutput = "";
    let repromptText = null;

    getGameScoreData(function(err, data) {
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

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText 
        }

        callback(result);
    });    
}

/*
* Helper functions
*/
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

/* Data functions */
function getMatchesData(callback) {
    getJSON("https://bravelocation.com/automation/feeds/matches.json", callback);
}

function getGameScoreData(callback) {
    getJSON("https://bravelocation.com/automation/feeds/gamescore.json", callback);
}

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

/* Export main object */
exports.yeltzlandSpeech = yeltzlandSpeech;