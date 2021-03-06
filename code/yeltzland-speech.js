const rp = require('request-promise-native');
const dateFormat = require('dateformat');

var yeltzlandSpeech = {};
yeltzlandSpeech.welcomeText = 'Ask about results, fixtures or the latest score.';
yeltzlandSpeech.welcomeTitle = 'Welcome';
yeltzlandSpeech.finishText = 'Thanks for coming!';
yeltzlandSpeech.finishTitle = 'Bye';
yeltzlandSpeech.fallbackText = "I didn't catch that. Can you ask me something else?";
yeltzlandSpeech.bestTeamText = 'The best team is Halesowen Town';
yeltzlandSpeech.errorText = "I'm sorry, something went wrong. Can you ask me something else?";
yeltzlandSpeech.bestTeamSpeak = '<speak><p><emphasis level="strong">Halesowen Town</emphasis></p><p><emphasis level="strong">Halesowen Town F C</emphasis></p><p><emphasis level="strong">They\'re by far the greatest team</emphasis></p><p><emphasis level="strong">The world has ever seen</emphasis></p></speak>';
yeltzlandSpeech.bestTeamTitle = "Who's the best team?";
yeltzlandSpeech.bestTeamText = "The best team are Halesowen Town";
yeltzlandSpeech.worstTeamSpeak = '<speak>The worst team are Stour <say-as interpret-as="expletive">bridge</say-as> Town</speak>';
yeltzlandSpeech.worstTeamText = 'The worst team are Stourbridge Town';
yeltzlandSpeech.worstTeamTitle = "Who's the worst team?";
yeltzlandSpeech.gamesTitlePrefix = "Halesowen games against ";
yeltzlandSpeech.halesowenGamesTitle = "Halesowen games";
yeltzlandSpeech.noGamesFound = "No games found on that day";
yeltzlandSpeech.latestScoreTitle = "Latest score";

yeltzlandSpeech.teamBased = async function(useFixtures, team) {
    let speechOutput = "";
    let textOutput = "";
    let repromptText = null;
    let matches = [];

    const data = await getMatchesDataPromise();

    if (data == null) {
        speechOutput = "I'm sorry I couldn't find that out right now";
        repromptText = "Please try again later";  
        textOutput =  "I'm sorry I couldn't find that out right now";   
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
                textOutput = matchesToText(fixtures);
                matches = fixtures;
            }
        } else {
            if (results.length == 0) {
                speechOutput = "No results found against " + team;
            } else {
                speechOutput = matchesToSpeech(results);
                textOutput = matchesToText(results);
                matches = results;
            }
        }        
    }

    var result = {
        speechOutput: speechOutput,
        repromptText: repromptText,
        textOutput: textOutput,
        matches: matches
    }

    return result;

};


yeltzlandSpeech.timeBased = async function(timeStart, timeEnd, callback) {
    let speechOutput = "";
    let textOutput = "";
    let repromptText = null;
    let matches = [];

    const data = await getMatchesDataPromise();

    if (data == null) {
        speechOutput = "I'm sorry I couldn't find that out right now";
        repromptText = "Please try again later";   
        textOutput =  "I'm sorry I couldn't find that out right now";        
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
            textOutput = "No games found on that day";
        } else {
            speechOutput = matchesToSpeech(matches);
            textOutput = matchesToText(matches);
        }
    }

    var result = {
        speechOutput: speechOutput,
        repromptText: repromptText,
        textOutput: textOutput,
        matches: matches 
    }

    return result;
};

yeltzlandSpeech.singleGame = async function(useFixtures) {
    let cardTitle = "No games found";
    let speechOutput = "";
    let textOutput = "";
    let repromptText = null;
    let team = null;
    let matches = [];

    const data = await getMatchesDataPromise();

    if (data == null) {
        speechOutput = "I'm sorry I couldn't find that out right now";
        repromptText = "Please try again later";     
        textOutput =  "I'm sorry I couldn't find that out right now";           
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

        if (useFixtures) {
            if (nextGame == null) {
                speechOutput = "No more fixtures found";
                textOutput = "No more fixtures found";
            } else {
                cardTitle = matchToTitle(nextGame)
                matches.push(nextGame);
                speechOutput = matchesToSpeech(matches);
                textOutput = matchesToText(matches);
                team = nextGame.Opponent
            }
        } else {
            if (lastGame == null) {
                speechOutput = "No more games found";
                textOutput = "No more games found";
            } else {
                cardTitle = matchToTitle(lastGame)
                matches.push(lastGame);
                speechOutput = matchesToSpeech(matches);
                textOutput = matchesToText(matches);
                team = lastGame.Opponent;
            }
        }
    }

    var result = {
        speechOutput: speechOutput,
        repromptText: repromptText,
        textOutput: textOutput,
        cardTitle: cardTitle,
        matches: matches,
        team: team
    }

    return result;
}

yeltzlandSpeech.gameScore = async function() {
    let speechOutput = "";
    let repromptText = null;
    let textOutput = "";    
    let cardTitle = "Latest score";
    let team = null;
    let matches = [];

    const data = await getGameScoreDataPromise();

    if (data == null) {
        speechOutput = "I'm sorry I couldn't find that out right now";
        textOutput = "I'm sorry I couldn't find that out right now";
        repromptText = "Please try again later";
    } else {
        var opponent = data.match.Opponent;
        var home = (data.match.Home == "1");
        var yeltzScore = data.yeltzScore || 0;
        var opponentScore = data.opponentScore || 0;

        speechOutput = "The latest score is ";
        textOutput = "The latest score is ";

        // Get the fixtures, and see if we are in progress or not
        const fixtures  = await getMatchesDataPromise();

        var lastGame = null;
        
        // Go through each of the matches
        for (var i = 0; i < fixtures.Matches.length; i++) {
            var match = fixtures.Matches[i];      
            
            if ((match.TeamScore != null) && (match.OpponentScore != null)) {
                lastGame = match;
            }  
        }

        // Have we finished?
        if (lastGame) {
            if (data.match.MatchDateTime == lastGame.MatchDateTime) {
                speechOutput = "The final score was ";
                textOutput = "The final score was ";

                yeltzScore = lastGame.TeamScore
                opponentScore = lastGame.OpponentScore
            }
        }

        if (home) {
            speechOutput += "Halesowen Town " + speakScore(yeltzScore) + ", " + teamToSpeech(opponent) + " " + speakScore(opponentScore);
            textOutput += "Halesowen Town " + yeltzScore + " -  " + opponent + " " + opponentScore;
        } else {
            speechOutput += teamToSpeech(opponent) + " " + speakScore(opponentScore) + ", Halesowen Town " + speakScore(yeltzScore);               
            textOutput += teamToSpeech(opponent) + " " + opponentScore + " - Halesowen Town " + yeltzScore;               
        }

        var generatedMatch = {
            MatchID: data.match.MatchID,
            MatchDateTime: data.match.MatchDateTime,
            Opponent: opponent,
            Home: home,
            TeamScore: yeltzScore,
            OpponentScore: opponentScore
        }

        cardTitle = matchToTitle(generatedMatch);
        matches.push(generatedMatch);
        team = opponent;
    }

    var result = {
        speechOutput: speechOutput,
        repromptText: repromptText,
        textOutput: textOutput,
        cardTitle: cardTitle,
        matches: matches,
        team: team
    }

    return result;    
};

yeltzlandSpeech.displayDate = function(matchDateString) {
    return dateFormat(parseDate(matchDateString), "ddd mmm dd HH:MM");
};

yeltzlandSpeech.teamImageUrl = function(teamName) {
    return "https://bravelocation.com/teamlogos/" + teamToSpeech(teamName).replace(/ /g, '_').toLowerCase() + ".png";
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


function matchesToText(matches) {
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
                output += ". We won " + match.TeamScore + "-" + match.OpponentScore;
            } else if (match.TeamScore == match.OpponentScore) {
                output += ". We drew " + match.TeamScore + "-" + match.OpponentScore;
            } else {
                output += ". We lost " + match.OpponentScore + "-" + match.TeamScore;
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
function getMatchesDataPromise() {
    return getJSONPromise("https://bravelocation.com/automation/feeds/matches.json");
};

function getGameScoreDataPromise() {
    return getJSONPromise("https://bravelocation.com/automation/feeds/gamescore.json");
};

function getJSONPromise(url) {
    const options = {
        method: 'GET',
        uri: url,
        json: true
    };

    const response = new Promise(
        function (resolve, reject) {
            rp(options)
                .then(function (response) {
                    if (response.data && response.data.Error) {
                        // The API returned an invalid request
                        console.log('Error calling API call: ' + url + ": " + response.data.Error);
                        reject(new Error(response.data.Error));                        
                    }
                    
                    resolve(response);
                })
                .catch(function (err) {
                    // API call failed...
                    console.log('Error calling API call: ' + url + ": " + err);
                    reject(err);
                });
        }
    );

    return response;
};


/* Export main object */
exports.yeltzlandSpeech = yeltzlandSpeech;