'use strict';

var axios = require('./axios');

var locations = {
  "clifton park" : {
    "office_name": "Clifton Park",
    "street_address_line_1": "22 Clifton Country Center",
    "city": "Clifton Park",
    "state": "NY",
    "zip_code": "12065",
    "mon_hrs": "8:00 AM to 4:15 PM",
    "tue_hrs": "8:00 AM to 4:15 PM",
    "wed_hrs": "8:00 AM to 4:15 PM",
    "thurs_hrs": "8:00 AM to 6:00 PM",
    "fri_hrs": "8:00 AM to 4:15 PM",
    "sat_hrs": "Closed",
    "longitude": "-73.777742",
    "latitude": "42.858472",
  },
  "albany" : {
    "office_name": "Albany",
    "street_address_line_1": "224-260 S. Pearl Street",
    "city": "Albany",
    "state": "NY",
    "zip_code": "12202",
    "mon_hrs": "8:30 AM to 4:00 AM",
    "tue_hrs": "8:30 AM to 4:00 AM",
    "wed_hrs": "8:30 AM to 4:00 AM",
    "thurs_hrs": "10:00 AM to 6:00 PM",
    "fri_hrs": "8:30 AM to 4:00 AM",
    "sat_hrs": "Closed",
    "longitude": "-73.756299",
    "latitude": "42.642577",
  },
  "ballston spa" : {
    "office_name": "Ballston Spa",
    "street_address_line_1": "40 McMaster Street",
    "city": "Ballston Spa",
    "state": "NY",
    "zip_code": "12020",
    "mon_hrs": "8:00 AM to 4:45 PM",
    "tue_hrs": "8:00 AM to 4:45 PM",
    "wed_hrs": "8:00 AM to 6:00 PM",
    "thurs_hrs": "8:00 AM to 4:45 PM",
    "fri_hrs": "8:00 AM to 4:45 PM",
    "sat_hrs": "Closed",
    "longitude": "-73.850503",
    "latitude": "42.998908",
  },
  "utica" : {
    "office_name": "Utica",
    "street_address_line_1": "321 Main Street",
    "city": "Utica",
    "state": "NY",
    "zip_code": "13501",
    "mon_hrs": "9:00 AM to 4:30 PM",
    "tue_hrs": "10:00 AM to 6:00 PM",
    "wed_hrs": "9:00 AM to 4:30 PM",
    "thurs_hrs": "10:00 AM to 6:00 PM",
    "fri_hrs": "9:00 AM to 4:30 PM",
    "sat_hrs": "Closed",
    "longitude": "-75.223885",
    "latitude": "43.103926",
  },
  "wilton" : {
    "office_name": "Saratoga Springs - Wilton",
    "street_address_line_1": "3065 Route 50, at the Wilton Mall",
    "city": "Saratoga Springs",
    "state": "NY",
    "zip_code": "12866",
    "mon_hrs": "8:00 AM to 4:45 PM",
    "tue_hrs": "8:00 AM to 6:00 PM",
    "wed_hrs": "8:00 AM to 4:45 PM",
    "thurs_hrs": "8:00 AM to 4:45 PM",
    "fri_hrs": "8:00 AM to 4:45 PM",
    "sat_hrs": "Closed",
    "longitude": "-73.738103",
    "latitude": "43.102048",
  }
};

/*
  Route the incoming request based on type (LaunchRequest, IntentRequest,
  etc.) The JSON body of the request is provided in the event parameter.
*/

exports.handler = function(event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    /*
      Uncomment this IF STATEMENT and populate it with your skill's application ID
      To prevent someone else from configuring a skill that sends requests to this function.
    */

    if (event.session.application.applicationId !== "amzn1.ask.skill.f3e32a75-3b1b-4c3e-8596-4ab5403ae4b7") {
      context.fail("Invalid Application ID");
    }

    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }

    if (event.request.type === "LaunchRequest") {
      onLaunch(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "IntentRequest") {
      onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any session init logic here.
}

// Called when the user invokes the skill without specifying an intent.
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
  getWelcomeResponse(callback);
}

// Called when the user specifies an intent for the skill.
function onIntent(intentRequest, session, callback) {
  console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

  var intent = intentRequest.intent;
  var intentName = intentRequest.intent.name;
  var previousPlace = session.attributes.previousPlace;

  // Dispatch to custom intents here:
  if ("GetLocationIntent" === intentName) {
    geocode(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getHelp(intent, session, callback);
  } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
    endSession(intent, session, callback);
  } else {
    throw "Invalid Intent";
  }
}

// Called when the user ends the session. Is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any cleanup logic here.
}

// --------------------------------------- SKILL SPECIFIC BUSINESS LOGIC -------------------------------------------
function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Testing Get Closest DMV Offices";
  var speechOutput = "To get the a list of DMV offices close to you say, what are the closest offices to me. ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}


function geocode() {
  var myLocation = '18 Swan Dr Rexford NY';
  axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: myLocation,
      key: 'AIzaSyAlrRcHfqyAHrUh6q8YIDiFtDD_NcD6khI'
    }
  })
  .then(function(response) {
    // Log Full Response
    console.log(response);

    // Geometry
    var homeLat = response.data.results[0].geometry.location.lat;
    var homeLng = response.data.results[0].geometry.location.lng;
  });

  var speechOutput = "Your home location is at latitude " + homeLat + " and longitude " + homeLng + ". ";
  var repromptText = speechOutput;

  callback(session.attributes, buildSpeechletResponse("Your Location", speechOutput, repromptText, true));

  .catch(function(error) {
    console.log(error);
  });
}

function getHomeLocation(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Home Location";
  var homeLat = geocode().homeLat;
  var homeLng = geocode().homeLng;
  var speechOutput = "Your home location is at latitude " + homeLat + " and longitude " + homeLng + ". ";
  var repromptText = speechOutput;
  var shouldEndSession = true;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getHelp(intent, session, callback) {
  var CARD_TITLE = "Help";
  var speechOutput = "I just need this here to test. ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  var CARD_TITLE = "Goodbye!";
  var speechOutput = "I just need this here to test. ";
  var repromptText = speechOutput;
  var shouldEndSession = true;

  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

// --------------------------------------- HELPER FUNCTIONS THAT BUILD ALL RESPONSES -------------------------------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: title,
      content: output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}











function distance(position1, position2) {
    var lat1 = position1.latitude;
    var lat2 = position2.latitude;
    var lng1 = position1.longitude;
    var lng2 = position2.longitude;
    var deltaLat = Math.abs(lat2 - lat1);
    var deltaLng = Math.abs(lng2 - lng1);
    var R = 6371000; // metres
    var φ1 = toRadians(lat1);
    var φ2 = toRadians(lat2);
    var Δφ = toRadians(deltaLat);
    var Δλ = toRadians(deltaLng);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    var dMiles = (d * 0.000621371192).toFixed(2);
    return dMiles;
}

var closest = locations[0];
var closest_distance = distance(closest,position.coords);
for (var i = 1; i < locations.length; i++) {
    if (distance(locations[i], position.coords) < closest_distance) {
         closest_distance = distance(locations[i], position.coords);
         closest = locations[i];
    }
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}
