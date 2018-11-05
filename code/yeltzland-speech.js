'use strict';
var request = require("request");
var dateFormat = require('dateformat');

var yeltzlandSpeech = {};
yeltzlandSpeech.welcomeText = 'Ask about results, fixtures or the latest score.';
yeltzlandSpeech.finishText = 'Thanks for coming!';
yeltzlandSpeech.fallbackText = "I didn't catch that. Can you ask me something else?";
yeltzlandSpeech.bestTeamText = 'The best team is Halesowen Town';
yeltzlandSpeech.worstTeamText = 'The worst team are Stourbridge Town';
yeltzlandSpeech.bestTeamSpeak = '<speak><p><emphasis level="strong">Halesowen Town</emphasis></p><p><emphasis level="strong">Halesowen Town F C</emphasis></p><p><emphasis level="strong">They\'re by far the greatest team</emphasis></p><p><emphasis level="strong">The world has ever seen</emphasis></p></speak>';
yeltzlandSpeech.worstTeamSpeak = '<speak>The worst team are Stour <say-as interpret-as="expletive">bridge</say-as> Town</speak>';

yeltzlandSpeech.teamBased = function(useFixtures, team, callback) {

    let speechOutput = "";
    let repromptText = null;
    let matches = [];

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
                
                if (teamToSpeech(match.Opponent).toLowerCase() == team.toLowerCase()) {
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
                    matches = fixtures;
                }
            } else {
                if (results.length == 0) {
                    speechOutput = "No results found against " + team;
                } else {
                    speechOutput = matchesToSpeech(results);
                    matches = results;
                }
            }
        }

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText,
            matches: matches
        }

        callback(result);
    });
};


yeltzlandSpeech.timeBased = function(timeStart, timeEnd, callback) {
    let speechOutput = "";
    let repromptText = null;
    let matches = [];

    getMatchesData(function(err, data) {
        if (err != null) {
            speechOutput = "I'm sorry I couldn't find that out right now";
            repromptText = "Please try again later";
        } else {
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
            repromptText: repromptText,
            matches: matches 
        }

        callback(result);
    });
};

yeltzlandSpeech.singleGame = function(useFixtures, callback) {
    let cardTitle = "No games found";
    let speechOutput = "";
    let repromptText = null;
    let team = null;
    let matches = [];

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

            if (useFixtures) {
                if (nextGame == null) {
                    speechOutput = "No more fixtures found";
                } else {
                    cardTitle = matchToTitle(nextGame)
                    matches.push(nextGame);
                    speechOutput = matchesToSpeech(matches);
                    team = nextGame.Opponent
                }
            } else {
                if (lastGame == null) {
                    speechOutput = "No more games found";
                } else {
                    cardTitle = matchToTitle(lastGame)
                    matches.push(lastGame);
                    speechOutput = matchesToSpeech(matches);
                    team = lastGame.Opponent;
                }
            }
        }

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText,
            cardTitle: cardTitle,
            matches: matches,
            team: team
        }

        callback(result);
    });
}

yeltzlandSpeech.gameScore = function(callback) {
    let speechOutput = "";
    let repromptText = null;
    let cardTitle = "Latest score";
    let team = null;

    getGameScoreData(function(err, data) {
        var matches = [];

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
                speechOutput += "Halesowen Town " + speakScore(yeltzScore) + ", " + teamToSpeech(opponent) + " " + speakScore(opponentScore);
            } else {
                speechOutput += teamToSpeech(opponent) + " " + speakScore(opponentScore) + ", Halesowen Town " + speakScore(yeltzScore);               
            }

            var generatedMatch = {
                Opponent: data.match.Opponent,
                Home: data.match.Home,
                TeamScore: data.yeltzScore,
                OpponentScore: data.opponentScore
            }
            cardTitle = matchToTitle(generatedMatch);
            matches.push(generatedMatch);
            team = opponent;
        }

        var result = {
            speechOutput: speechOutput,
            repromptText: repromptText,
            cardTitle: cardTitle,
            matches: matches,
            team: team
        }

        callback(result);
    });    
};

yeltzlandSpeech.displayDate = function(matchDateString) {
    return dateFormat(parseDate(matchDateString), "ddd mmm dd HH:MM");
};

yeltzlandSpeech.teamImageUrl = function(teamName) {
    return "https://bravelocation.com/teamlogos/" + teamToSpeech(teamName).replace(' ', '_').toLowerCase() + ".png";
};

yeltzlandSpeech.titleCase = function(teamName) {
    return teamName.toLowerCase().split(' ').map(function(word) {
        return word.replace(word[0], word[0].toUpperCase());
     }).join(' ');
};

/*
* Helper functions
*/


function teamToSpeech(teamName) {
    var startBracket = teamName.indexOf(" (");

    if (startBracket > 0) {
        return teamName.substring(0, startBracket)
    }

    return teamName;
};

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

        output += teamToSpeech(match.Opponent) + (match.Home == "0" ? " away " : " at home ") + "on " + speakDate(match.MatchDateTime); 

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
};

function matchToTitle(match) {
    var output = "";
    var fixture = (match.TeamScore == null) || (match.OpponentScore == null);  
    var yeltzAtHome = (match.Home == "1");
    
    if (yeltzAtHome) {
        output += "Yeltz"; 
    } else {
        output += match.Opponent;
    }

    if (fixture) {
        output += " v ";  
    } else {
        output += " ";  
        if (yeltzAtHome) {
            output += match.TeamScore; 
        } else {
            output += match.OpponentScore;
        }
        output += " ";          
    }

    if (!yeltzAtHome) {
        output += "Yeltz"; 
    } else {
        output += match.Opponent;
    }

    if (!fixture) {
        output += " ";  
        if (!yeltzAtHome) {
            output += match.TeamScore; 
        } else {
            output += match.OpponentScore;
        }       
    }
        
    return output;
    
};

function speakScore(score) {
    if (score == 0) {
        return "nil";
    }

    return score.toString();
};

function speakDate(dateString) {
    return dateFormat(parseDate(dateString), "dddd, mmmm dS, yyyy");
};

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
};

function parseDate(dateString) {
    var dateStringParts = dateString.split(' ');
    var dayParts = dateStringParts[0].split('-');
    var timeParts = dateStringParts[1].split(':');
    
    return new Date(dayParts[0],dayParts[1] - 1,dayParts[2],timeParts[0],timeParts[1],timeParts[2]);
};

/* Data functions */
function getMatchesData(callback) {
    getJSON("https://bravelocation.com/automation/feeds/matches.json", callback);
};

function getGameScoreData(callback) {
    getJSON("https://bravelocation.com/automation/feeds/gamescore.json", callback);
};

function getJSON(url, callback) {
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