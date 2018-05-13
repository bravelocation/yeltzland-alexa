'use strict';
var testHarness = require("./bst-test-harness");

describe('Intent Tests', function() {
    it('Last Result Intent should return something', function(done) {
        testHarness.makeLocalSkillRequest("LastResultIntent", null, "We played ", done);
    });
    it('Result Intent should return something', function(done) {
        var teamSlot = { "Team": {"value":"Stourbridge"}};
        testHarness.makeLocalSkillRequest("ResultIntent", teamSlot, "We played Stourbridge ", done);
    });
});