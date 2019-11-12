var AlexaHelper = function () {}

AlexaHelper.imageSmallUrl = "https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_small.png";
AlexaHelper.imageLargeUrl = "https://s3-eu-west-1.amazonaws.com/yeltzland-alexa-images/htfc_logo_large.png";

AlexaHelper.card = function(handlerInput, cardTitle, speechText) {
  return handlerInput.responseBuilder
    .speak(speechText)
    .withStandardCard(cardTitle, speechText, this.imageSmallUrl, this.imageLargeUrl)
    .getResponse();
};

AlexaHelper.cardWithSpeech = function(handlerInput, cardTitle, speechText, cardText) {
    return this.cardWithSpeechAndImages(handlerInput, cardTitle, speechText, cardText, this.imageSmallUrl, this.imageLargeUrl);
};
  
AlexaHelper.cardWithSpeechAndImages = function(handlerInput, cardTitle, speechText, cardText, smallImage, largeImage) {
    return handlerInput.responseBuilder
      .speak(speechText)
      .withStandardCard(cardTitle, cardText, smallImage, largeImage)
      .getResponse();
  };

AlexaHelper.cardWithReprompt = function(handlerInput, cardTitle, speechText) {
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withStandardCard(cardTitle, speechText, this.imageSmallUrl, this.imageLargeUrl)
      .getResponse();
};

AlexaHelper.speakWithReprompt = function(handlerInput, speechText) {
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
};

AlexaHelper.linkAccountCard = function(handlerInput, speechText) {
  return handlerInput.responseBuilder
            .speak(speechText)
            .withLinkAccountCard()
            .getResponse();
}

module.exports = AlexaHelper;