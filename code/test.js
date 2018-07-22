'use strict';
var testHarness = require("./bst-test-harness");

describe('Intent Tests', function() {
    it('Last Result Intent should return something', function(done) {
        testHarness.makeLocalSkillRequest("LastResultIntent", null, "We played ", done);
    });
    it('Result Intent should return something', function(done) {
        var teamSlot = { "Team": {"value":"Romulus"}};
        testHarness.makeLocalSkillRequest("ResultIntent", teamSlot, "We played Romulus", done);
    });    
    it('Best Team Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("BestTeamIntent", null, "<speak><p><emphasis level=\"strong\">Halesowen Town</emphasis></p>", done);
    });    
    it('Worst Team Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("WorstTeamIntent", null, "<speak>The worst team are Stour <say-as interpret-as=\"expletive\">bridge</say-as> Town</speak>", done);
    });
    it('GameTimeIntent when no games on that day', function(done) {
        var dateSlot = { "date": {"value":"2010-01-01"}};
        testHarness.makeLocalSkillRequest("GameTimeIntent", dateSlot, "No games found on that day", done);
    });
    it('Game Score Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("GameScoreIntent", null, "The latest score is ", done);
    });
    it('AMAZON.HelpIntent Intent works as expected', function(done) {
        testHarness.makeLocalSkillRequest("AMAZON.HelpIntent", null, "Thanks for coming!", done);
    });
    it('Result Intent should return team image', function(done) {
        var teamSlot = { "Team": {"value":"Romulus"}};
        testHarness.makeLocalSkillRequest("ResultIntent", teamSlot, "https://bravelocation.com/teamlogos/romulus.png", done, true);
    });  
    it('Worst Team Intent returns correct image', function(done) {
        testHarness.makeLocalSkillRequest("WorstTeamIntent", null, "https://bravelocation.com/teamlogos/stourbridge.png", done, true);
    });
});