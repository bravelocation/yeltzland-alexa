'use strict';
var request = require("request");

/*
    Makes a request to the locally running skill (running under bst proxy lambda index.js)

    @intentName: Name of the intent we are querying against
    @slots: Slots to use in the intent. Can be null or formatted like { "Team": {"value":"Stourbridge"}}
    @responseStart: The text the text response will start with (or team name for imageTests)
    @done: Mocha function to denote pass or failure of the test
*/
var makeLocalSkillRequest = function(intentName, slots, responseStart, done, imageTest) {
    // Build the Alexa Skill payload for the request
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

    // Send the request to the locally running skill
    var localUrl = "http://localhost:10000";

    request.post({
                    url: localUrl,
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, 
        function (error, response, body) {
            if (imageTest) {
                if (!error && response.statusCode === 200) {
                    imageTestResultHandler(null, body, responseStart, done);
                } else {
                    imageTestResultHandler(error, null, responseStart, done);
                }
            } else {
                if (!error && response.statusCode === 200) {
                    testResultHandler(null, body, responseStart, done);
                } else {
                    testResultHandler(error, null, responseStart, done);
                }               
            }
        });
}

var testResultHandler = function(err, response, responseStart, done) {
    // If the requested errored, we're done
    if (err) {
        done(err);
        return;
    } 
    
    // Check the response starts with the given text
    var result = JSON.parse(response);

    if (result.response.outputSpeech.type == "PlainText") {
        var responseText = result.response.outputSpeech.text;
        var expectedOutputFound = responseText.startsWith(responseStart);
    
        if (expectedOutputFound) {
            done();
        } else {
            done("ERROR: Unexpected text: " + result.response.outputSpeech.text);
        }
    } else if (result.response.outputSpeech.type == "SSML") {
        var responseText = result.response.outputSpeech.ssml;
        var expectedOutputFound = responseText.startsWith(responseStart);
    
        if (expectedOutputFound) {
            done();
        } else {
            done("ERROR: Unexpected SSML: " + result.response.outputSpeech.ssml);
        }
    }
};

var imageTestResultHandler = function(err, response, smallImageUrl, done) {
    // If the requested errored, we're done
    if (err) {
        done(err);
        return;
    } 
    
    // Check the response starts with the given text
    var result = JSON.parse(response);

    var responseSmallImage = result.response.card.image.smallImageUrl;
    var expectedOutputFound = responseSmallImage == smallImageUrl;
    
    if (expectedOutputFound) {
        done();
    } else {
        done("ERROR: Unexpected image: " + responseSmallImage);
    }
};
exports.makeLocalSkillRequest = makeLocalSkillRequest;