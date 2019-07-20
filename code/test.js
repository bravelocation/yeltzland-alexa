'use strict';
var testHarness = require("./bst-test-harness");

describe('Intent Tests', function() {
    it('Last Result Intent should return something', function(done) {
        testHarness.makeLocalSkillRequest("LastResultIntent", null, "<speak>We played ", done);
    });    
    it('Next game Intent should return something', function(done) {
        testHarness.makeLocalSkillRequest("NextGameIntent", null, "<speak>We will play ", done);
    });
    it('Fixture Intent should return something', function(done) {
        var teamSlot = { "Team": {"value":"Stourbridge"}};
        testHarness.makeLocalSkillRequest("FixtureIntent", teamSlot, "<speak>We will play Stourbridge", done);
    }); 
    it('Result Intent should return something', function(done) {
        var teamSlot = { "Team": {"value":"Stourbridge"}};
        testHarness.makeLocalSkillRequest("ResultIntent", teamSlot, "<speak>We played Stourbridge", done);
    });  
    it('Result Intent should return team image', function(done) {
        var teamSlot = { "Team": {"value":"Stourbridge"}};
        testHarness.makeLocalSkillRequest("ResultIntent", teamSlot, "https://bravelocation.com/teamlogos/stourbridge.png", done, true);
    }); 

    it('Best Team Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("BestTeamIntent", null, "<speak><p><emphasis level=\"strong\">Halesowen Town</emphasis></p>", done);
    });    
    it('Worst Team Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("WorstTeamIntent", null, "<speak>The worst team are Stour <say-as interpret-as=\"expletive\">bridge</say-as> Town</speak>", done);
    });
    it('Worst Team Intent returns correct image', function(done) {
        testHarness.makeLocalSkillRequest("WorstTeamIntent", null, "https://bravelocation.com/teamlogos/stourbridge.png", done, true);
    });

    it('GameTimeIntent when no games on that day', function(done) {
        var dateSlot = { "date": {"value":"2010-01-01"}};
        testHarness.makeLocalSkillRequest("GameTimeIntent", dateSlot, "<speak>No games found on that day</speak>", done);
    });

    it('AMAZON.HelpIntent Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("AMAZON.HelpIntent", null, "<speak>Ask about results, fixtures or the latest score.", done);
    });

    it('Game Score Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("GameScoreIntent", null, "<speak>The final score was ", done);
    });


});