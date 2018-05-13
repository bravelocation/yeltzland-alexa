'use strict';
var request = require("request");

var makeLocalSkillRequest = function(intentName, slots, callback) {
    // slots like { "Team": {"value":"Stourbridge"}}
    var payload = {
        "session": {
            "application": {"applicationId":"12345"}, 
            "sessionId":"s456"
        }, 
        "request": {
            "type": "IntentRequest", 
            "requestId":"r123", 
            "intent": {
                "name": intentName, 
                "slots": slots
            }
        }
    }

    var localUrl = "http://localhost:10000";

    request.post({
                    url: localUrl,
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, 
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                callback(null, body);
            } else {
                callback(error, null);
            }
        });
}

var testResultHandler = function(err, response) {
    if (err) {
        console.log("ERROR:" + err);
        return;
    } 
    
    var result = JSON.parse(response);
    console.log(result.response.outputSpeech.text);
};

// Test last result intent
makeLocalSkillRequest("LastResultIntent", null, testResultHandler);

// Test result intent
var teamSlot = { "Team": {"value":"Stourbridge"}};
makeLocalSkillRequest("ResultIntent", teamSlot, testResultHandler);