# yeltzland-alexa
Code for the Yeltzland Alexa skill

It can tell you the latest Halesowen Town scores and fixtures if you ask nicely

## Testing locally

The code is designed to run on AWS Lambda, but to run locally you need to:

1. Install ```npm install bespoken-tools -g```
2. Start the proxy server by running ```bst proxy lambda index.js``` in the code sub-directory
3. Call the service directly via curl e.g.

```curl -H "Content-Type: application/json" -X POST -d '{"session": {"application":{"applicationId":"12345"}, "sessionId":"s456"},"request":{"type": "IntentRequest", "requestId":"r123", "intent":{"name":"LastResultIntent"}}}' http://localhost:10000```

or

```curl -H "Content-Type: application/json" -X POST -d '{"session": {"application":{"applicationId":"12345"}, "sessionId":"s456"},"request":{"type": "IntentRequest", "requestId":"r123", "intent":{"name":"ResultIntent", "slots":{ "Team": {"value":"Stourbridge"}}}}}' http://localhost:10000```

Full Bespoken documentation is at [http://docs.bespoken.io/en/latest/](http://docs.bespoken.io/en/latest/)