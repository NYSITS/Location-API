'use strict';

var axios = require('./axios');

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

    if (event.session.application.applicationId !== "amzn1.ask.skill.d22a5ce4-9738-44e5-9014-1b92e3b0c9cb") {
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

  // Dispatch to custom intents here:
  if ("GetAddressIntent" === intentName) {
    getAddress(intent, session, callback);
  } else if ("ClosestOfficeIntent" === intentName) {
    getAddress(intent, session, callback);
  } else if ("AMAZON.YesIntent" === intentName) {
    closestOffices(intent, session, callback);
  } else if ("AMAZON.NoIntent" === intentName) {
    endSession(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getHelp(intent, session, callback);
  } else if ("AMAZON.StopIntent" === intentName) {
    endSession(intent, session, callback);
  } else if ("AMAZON.CancelIntent" === intentName) {
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
// var HOME_LAT = 42.854307;
// var HOME_LNG = -73.8433079;

function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Welcome!";
  var speechOutput = "Tell me your address and I can tell you the three closest DMV offices to you. When saying your address please include the following: "
  + "Street Number, Street Address, City, State, and Zip Code. What is your address? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getAddress(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Getting Your Address";
  var streetNumber = intent.slots.Number.value;
  var streetAddress = intent.slots.Street.value;
  var city = intent.slots.City.value;
  var state = intent.slots.State.value;
  var zip = intent.slots.Zip.value;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  var googleAddress;
  var userAddress;
  var location = [];
  var latitude;
  var longitude;

  if (streetNumber && streetAddress && city && state && zip) {
    googleAddress = streetNumber + " " + streetAddress + " " + city + " " + state + " " + zip;

    userAddress = streetNumber + " " + capitalizeFirst(streetAddress) + ", " + capitalizeFirst(city) + ", " + state + " " + zip;
    speechOutput = "You're address is " + userAddress + " correct? ";
    repromptText = speechOutput;
  }

  axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: googleAddress,
      key: 'AIzaSyAlrRcHfqyAHrUh6q8YIDiFtDD_NcD6khI'
    }
  }).then(function(response) {
    // Log Full Response
    console.log(response);

    // Geometry
    latitude = response.data.results[0].geometry.location.lat;
    longitude = response.data.results[0].geometry.location.lng;
    location.push({"user_lat": latitude, "user_lng": longitude});
  }).catch(function(error) {
    console.log(error);
  });


  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "userAddress": userAddress,
    "userLatitude": latitude,
    "userLongitude": longitude,
    "previousPlace": "Get Address"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

// function geocode(session) {
//   var userAddress = session.attributes.userAddress;
//   var latLng = [];
//   axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
//     params: {
//       address: userAddress,
//       key: 'AIzaSyAlrRcHfqyAHrUh6q8YIDiFtDD_NcD6khI'
//     }
//   })
//   .then(function(response) {
//     // Log Full Response
//     console.log(response);

//     // Geometry
//     var latitude = response.data.results[0].geometry.location.lat;
//     var longitude = response.data.results[0].geometry.location.lng;
//     latLng.push({user_lat: latitude, user_lng: longitude});
//     return latLng;
//   });

// }

// function getDistance(session, attributes) {
//   var sessionAttributes = {};
//   var calcDistance = [];
//   var userAddress = session.attributes.userAddress;
//   var latLng = [];
//   axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
//     params: {
//       address: userAddress,
//       key: 'AIzaSyAlrRcHfqyAHrUh6q8YIDiFtDD_NcD6khI'
//     }
//   })
//   .then(function(response) {
//     // Log Full Response
//     console.log(response);
//
//     // Geometry
//     var latitude = response.data.results[0].geometry.location.lat;
//     var longitude = response.data.results[0].geometry.location.lng;
//     latLng.push({user_lat: latitude, user_lng: longitude});
//     return latLng;
//   });
//   for (var i = 0; i < dmvOffice.length; i++) {
//     var office = dmvOffice[i].office_name;
//     var dmvLat = dmvOffice[i].latitude;
//     var dmvLng = dmvOffice[i].longitude;
//     var address = dmvOffice[i].address;
//     var HOME_LAT = latLng[0].user_lat;
//     var HOME_LNG = latLng[0].user_lng;
//
//     var deltaLat = Math.abs(dmvLat - HOME_LAT);
//     var deltaLng = Math.abs(dmvLng - HOME_LNG);
//     var R = 6371000;
//     var φ1 = HOME_LAT * (Math.PI / 180);
//     var φ2 = dmvLat * (Math.PI / 180);
//     var Δφ = deltaLat * (Math.PI / 180);
//     var Δλ = deltaLng * (Math.PI / 180);
//
//     var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     var d = R * c;
//     var dMiles = (d * 0.000621371192).toFixed(2);
//
//     calcDistance.push({officeName: office, distance: dMiles, location: address});
//   }
//
//   return calcDistance;
// }

function closestOffices(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "The Top 3 Closest DMV Offices To You";
  var calcDistance = [];
  var userAddress = session.attributes.userAddress;
  var homeLat;
  var homeLng;
  // var latLng = [];

  // axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
  //   params: {
  //     address: userAddress,
  //     key: 'AIzaSyAlrRcHfqyAHrUh6q8YIDiFtDD_NcD6khI'
  //   }
  // })
  // .then(function(response) {
  //   // Log Full Response
  //   console.log(response);
  //
  //   // Geometry
  //   var latitude = response.data.results[0].geometry.location.lat;
  //   console.log(latitude);
  //   var longitude = response.data.results[0].geometry.location.lng;
  //   console.log(longitude);
  //   latLng.push({userLat: latitude, userLng: longitude});
  //   return latLng;
  // });

  for (var i = 0; i < dmvOffice.length; i++) {
    var office = dmvOffice[i].office_name;
    var dmvLat = dmvOffice[i].latitude;
    var dmvLng = dmvOffice[i].longitude;
    var address = dmvOffice[i].address;
    var homeLat = parseInt(session.attributes.userLatitude);
    var homeLng = parseInt(session.attributes.userLongitude);

    var deltaLat = Math.abs(dmvLat - homeLat);
    var deltaLng = Math.abs(dmvLng - homeLng);
    var R = 6371000;
    var φ1 = homeLat * (Math.PI / 180);
    var φ2 = dmvLat * (Math.PI / 180);
    var Δφ = deltaLat * (Math.PI / 180);
    var Δλ = deltaLng * (Math.PI / 180);

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    var dMiles = (d * 0.000621371192).toFixed(2);

    calcDistance.push({officeName: office, distance: dMiles, location: address});
  }

  var calculatedDistance = calcDistance.sort(function(a, b) {
    return parseFloat(a.distance) - parseFloat(b.distance);
  });

  var speechOutput = "Here are the top three closest DMV Offices to you. 1: The " + calculatedDistance[0].officeName + ", which is located at " + calculatedDistance[0].location
  + ". 2: The " + calculatedDistance[1].officeName + ", which is located at " + calculatedDistance[1].location + ". And 3: The " + calculatedDistance[2].officeName + ", which is located at " + calculatedDistance[2].location + ". Do you need to hear this information again? ";

  var repromptText = "Do you need to hear this information again? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "userAddress": userAddress,
    "userLatitude": homeLat,
    "userLongitude": homeLng,
    "previousPlace": "Closest Offices"
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

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

var dmvOffice = [
  {
    office_name: "Oswego DMV Office",
    latitude: 43.4318042,
    longitude: -76.4828885,
    address: "384 East River Road, Oswego, NY, 13126"
  },
  {
    office_name: "Niagara Falls DMV Office",
    latitude: 43.098766,
    longitude: -79.049355,
    address: "1001 11th Street, Niagara Falls, NY, 14301"
  },
  {
    office_name: "Belmont DMV Office",
    latitude: 42.224958,
    longitude: -78.033314,
    address: "7 Court Street, Belmont, NY, 14813"
  },
  {
    office_name: "Greece DMV Office",
    latitude: 43.2146633,
    longitude: -77.7250018,
    address: "152 Greece Ridge Center, Rochester, NY, 14626"
  },
  {
    office_name: "Deposit DMV Office",
    latitude: 42.0619508,
    longitude: -75.4208464,
    address: "3 Elm Street, Deposit, NY, 13754"
  },
  {
    office_name: "Brooklyn DMV Office",
    latitude: 40.6838452,
    longitude: -73.9754325,
    address: "625 Atlantic Avenue, Brooklyn, NY, 11217"
  },
  {
    office_name: "Little Valley DMV Office",
    latitude: 42.2520075,
    longitude: -78.8013227,
    address: "303 Court Street, Little Valley, NY, 14755"
  },
  {
    office_name: "Ithaca DMV Office",
    latitude: 42.4471281,
    longitude: -76.5047394,
    address: "301 Third Street, Ithaca, NY, 14850"
  },
  {
    office_name: "Wappingers Falls DMV Office",
    latitude: 41.590977,
    longitude: -73.905422,
    address: "29 Marshall Road, Wappingers Falls, NY, 12590"
  },
  {
    office_name: "Fulton DMV Office",
    latitude: 43.330733,
    longitude: -76.416438,
    address: "200 North Second Street, Fulton, NY, 13069"
  },
  {
    office_name: "Binghamton DMV Office",
    latitude: 42.101498,
    longitude: -75.910182,
    address: "81 Chenango Street, Binghamton, NY, 13901"
  },
  {
    office_name: "Williamsville DMV Office",
    latitude: 42.972952,
    longitude: -78.693062,
    address: "6205 Main Street, Williamsville, NY, 14221"
  },
  {
    office_name: "Schoharie DMV Office",
    latitude: 42.663509,
    longitude: -74.312761,
    address: "284 Main Street, Schoharie, NY, 12157"
  },
  {
    office_name: "Elmira DMV Office",
    latitude: 42.077915,
    longitude: -76.801595,
    address: "425-477 Pennsylvania Avenue, Elmira, NY, 14904"
  },
  {
    office_name: "Brewster DMV Office",
    latitude: 41.428313,
    longitude: -73.626621,
    address: "1 Geneva Road, Brewster, NY, 10509"
  },
  {
    office_name: "Newburgh DMV Office",
    latitude: 41.500575,
    longitude: -74.012463,
    address: "128 Broadway, Newburgh, NY, 12550"
  },
  {
    office_name: "Millbrook DMV Office",
    latitude: 41.786177,
    longitude: -73.695255,
    address: "15 Merritt Avenue, Millbrook, NY, 12545"
  },
  {
    office_name: "Gouverneur DMV Office",
    latitude: 44.32465,
    longitude: -75.481562,
    address: "1227 U.S. Highway 11, Gouverneur, NY, 13642"
  },
  {
    office_name: "Endicott DMV Office",
    latitude: 42.101329,
    longitude: -76.048428,
    address: "124-132 Washington Avenue, Endicott, NY, 13760"
  },
  {
    office_name: "Huntington DMV Office",
    latitude: 40.858357,
    longitude: -73.41845,
    address: "813 New York Avenue, Huntington, NY, 11743"
  },
  {
    office_name: "Cheektoaga DMV Office",
    latitude: 42.919785,
    longitude: -78.734883,
    address: "2122 George Urban Boulevard, Depew, NY, 14043"
  },
  {
    office_name: "North Syracuse DMV Office",
    latitude: 43.126406,
    longitude: -76.115814,
    address: "5801 East Taft Road, North Syracuse, NY, 13212"
  },
  {
    office_name: "Orchard Park DMV Office",
    latitude: 42.772771,
    longitude: -78.798198,
    address: "4041 Southwestern Boulevard, Orchard Park, NY, 14224"
  },
  {
    office_name: "Penn Yan DMV Office",
    latitude: 42.664332,
    longitude: -77.058343,
    address: "417 Liberty Street, Penn Yan, NY, 14527"
  },
  {
    office_name: "Old Forge DMV Office",
    latitude: 43.708734,
    longitude: -74.973902,
    address: "183 Park Avenue, Old Forge, NY, 13420"
  },
  {
    office_name: "Amherst DMV Office",
    latitude: 42.980445,
    longitude: -78.819265,
    address: "3094-A Sheridan Drive, Amherst, NY, 14226"
  },
  {
    office_name: "Pulaski DMV Office",
    latitude: 43.565976,
    longitude: -76.128839,
    address: "2 Broad Street, Pulaski, NY, 13142"
  },
  {
    office_name: "Hauppauge DMV Office",
    latitude: 40.820719,
    longitude: -73.219216,
    address: "250 Veterans Memorial Highway, Hauppauge, NY, 11788"
  },
  {
    office_name: "Lowville DMV Office",
    latitude: 43.76784,
    longitude: -75.464877,
    address: "7049 State Route 12, Lowville, NY, 13367"
  },
  {
    office_name: "Dansville DMV Office",
    latitude: 42.559448,
    longitude: -77.695642,
    address: "14 Clara Barton Street, Dansville, NY, 14437"
  },
  {
    office_name: "Jamaica DMV Office",
    latitude: 40.707399,
    longitude: -73.791969,
    address: "168-46 91st Avenue, Jamaica, NY, 11432"
  },
  {
    office_name: "Fort Edward DMV Office",
    latitude: 43.286531,
    longitude: -73.586605,
    address: "383 Broadway, Fort Edward, NY, 12828"
  },
  {
    office_name: "Olean DMV Office",
    latitude: 42.086296,
    longitude: -78.450261,
    address: "1 Leo Moss Drive, Olean, NY, 14760"
  },
  {
    office_name: "Medford DMV Office",
    latitude: 40.824892,
    longitude: -72.993627,
    address: "2799 Route 112, Medford, NY, 11763"
  },
  {
    office_name: "Harlem DMV Office",
    latitude: 40.804276,
    longitude: -73.936584,
    address: "159 East 125th Street, New York, NY, 10035"
  },
  {
    office_name: "Delevan DMV Office",
    latitude: 42.495305,
    longitude: -78.475275,
    address: "1006 North Main Street, Delevan, NY, 14042"
  },
  {
    office_name: "Lower Manhattan DMV Office",
    latitude: 40.705272,
    longitude: -74.014622,
    address: "11 Greenwich Street, New York, NY, 10004"
  },
  {
    office_name: "Herkimer DMV Office",
    latitude: 43.028545,
    longitude: -74.988403,
    address: "109 Mary Street, Herkimer, NY, 13350"
  },
  {
    office_name: "Poughkeepsie DMV Office",
    latitude: 41.703598,
    longitude: -73.929524,
    address: "22 Market Street, Poughkeepsie, NY, 12601"
  },
  {
    office_name: "Lake George DMV Office",
    latitude: 43.35951,
    longitude: -73.699597,
    address: "1340 State Route 9, Lake George, NY, 12845"
  },
  {
    office_name: "Springfield Gardens DMV Office",
    latitude: 40.658878,
    longitude: -73.771499,
    address: "168-35 Rockaway Boulevard, Jamaica, NY, 11434"
  },
  {
    office_name: "Coney Island DMV Office",
    latitude: 40.577894,
    longitude: -73.975507,
    address: "2875 West 8th Street, Brooklyn, NY, 11224"
  },
  {
    office_name: "Clifton Park DMV Office",
    latitude: 42.909431,
    longitude: -73.798869,
    address: "22 Clifton Country Center, Clifton Park, NY, 12068"
  },
  {
    office_name: "Geneva DMV Office",
    latitude: 42.86678,
    longitude: -76.984084,
    address: "83 Seneca Street, Geneva, NY, 14456"
  },
  {
    office_name: "Schenectady DMV Office",
    latitude: 42.814501,
    longitude: -73.944475,
    address: "267 State Street, Schenectady, NY, 12305"
  },
  {
    office_name: "Cooperstown DMV Office",
    latitude: 42.701178,
    longitude: -74.929926,
    address: "197 Main Street, Cooperstown, NY, 13326"
  },
  {
    office_name: "Rome DMV Office",
    latitude: 43.212738,
    longitude: -75.462004,
    address: "301 West Dominick Street, Rome, NY, 13440"
  },
  {
    office_name: "License Express DMV Office",
    latitude: 40.748342,
    longitude: -73.991552,
    address: "145 West 30th Street, New York, NY, 10001"
  },
  {
    office_name: "Canandaigua DMV Office",
    latitude: 42.889187,
    longitude: -77.280217,
    address: "20 Ontario Street, Canandaigua, NY, 14424"
  },
  {
    office_name: "Bronx DMV Office",
    latitude: 40.837321,
    longitude: -73.840317,
    address: "1350 Commerce Avenue, Bronx, NY, 10461"
  },
  {
    office_name: "Massapequa DMV Office",
    latitude: 40.700927,
    longitude: -73.431011,
    address: "927 Carmans Road, Massapequa, NY, 11758"
  },
  {
    office_name: "Lockport DMV Office",
    latitude: 43.170694,
    longitude: -78.689603,
    address: "111 Main Street, Lockport, NY, 14095"
  },
  {
    office_name: "Midtown Manhattan DMV Office",
    latitude: 40.751565,
    longitude: -73.997043,
    address: "366 West 31st Street, New York, NY, 10001"
  },
  {
    office_name: "Norwich DMV Office",
    latitude: 42.531935,
    longitude: -75.525911,
    address: "5 Court Street, Norwich, NY, 13815"
  },
  {
    office_name: "Sidney DMV Office",
    latitude: 42.317241,
    longitude: -75.390465,
    address: "21 Liberty Street, Sidney, NY, 13838"
  },
  {
    office_name: "Johnstown DMV Office",
    latitude: 43.006828,
    longitude: -74.374997,
    address: "223 West Main Street, Johnstown, NY, 12095"
  },
  {
    office_name: "Elizabethtown DMV Office",
    latitude: 44.215217,
    longitude: -73.594261,
    address: "7559 Court Street, Elizabethtown, NY, 12932"
  },
  {
    office_name: "Wampsville DMV Office",
    latitude: 43.080902,
    longitude: -75.707461,
    address: "138 North Court Street, Wampsville, NY, 13163"
  },
  {
    office_name: "Peekskill DMV Office",
    latitude: 41.290641,
    longitude: -73.91812,
    address: "1045 Park Street, Peekskill, NY, 10566"
  },
  {
    office_name: "North Tonawanda DMV Office",
    latitude: 43.038583,
    longitude: -78.866291,
    address: "500 Wheatfield Street, North Tonawanda, NY, 14120"
  },
  {
    office_name: "Garden City DMV Office",
    latitude: 40.740027,
    longitude: -73.607477,
    address: "801 Axinn Avenue, Garden City, NY, 11530"
  },
  {
    office_name: "Wilton DMV Office",
    latitude: 43.101312,
    longitude: -73.739171,
    address: "3065 Route 50, Saratoga Springs, NY, 12866"
  },
  {
    office_name: "Middletown DMV Office",
    latitude: 41.445764,
    longitude: -74.420569,
    address: "12 King Street, Middletown, NY, 10940"
  },
  {
    office_name: "Buffalo DMV Office",
    latitude: 42.884589,
    longitude: -78.875957,
    address: "170 Pearl Street, Buffalo, NY, 14203"
  },
  {
    office_name: "Margaretville DMV Office",
    latitude: 42.148522,
    longitude: -74.648651,
    address: "733 Main Street, Margaretville, NY, 12455"
  },
  {
    office_name: "Albion DMV Office",
    latitude: 43.238145,
    longitude: -78.214506,
    address: "14016 Route 31 West, Albion, NY, 14411"
  },
  {
    office_name: "Waterloo DMV Office",
    latitude: 42.908274,
    longitude: -76.843666,
    address: "1 Di Pronio Drive, Waterloo, NY, 13165"
  },
  {
    office_name: "Albany DMV Office",
    latitude: 42.6422697,
    longitude: -73.7545938,
    address: "224-260 South Pearl Street, Albany, NY, 12202"
  },
  {
    office_name: "Mayville DMV Office",
    latitude: 42.254474,
    longitude: -79.505236,
    address: "7 North Erie Street, Mayville, NY, 14757"
  },
  {
    office_name: "Dunkirk DMV Office",
    latitude: 42.457629,
    longitude: -79.330387,
    address: "3988 Vineyard Drive, Dunkirk, NY, 14048"
  },
  {
    office_name: "Bath DMV Office",
    latitude: 42.333042,
    longitude: -77.316247,
    address: "3 East Pulteney Square, Bath, NY, 14810"
  },
  {
    office_name: "Riverhead DMV Office",
    latitude: 40.936502,
    longitude: -72.651411,
    address: "200 Old Country Road, Riverhead, NY, 11901"
  },
  {
    office_name: "Plattsburgh DMV Office",
    latitude: 44.699316,
    longitude: -73.453611,
    address: "137 Margaret Street, Plattsburgh, NY, 12901"
  },
  {
    office_name: "Cortland DMV Office",
    latitude: 42.599261,
    longitude: -76.160802,
    address: "112 River Street, Cortland, NY, 13045"
  },
  {
    office_name: "Massena DMV Office",
    latitude: 44.922173,
    longitude: -74.892206,
    address: "21 Harrowgate Commons, Massena, NY, 13662"
  },
  {
    office_name: "Delhi DMV Office",
    latitude: 42.277946,
    longitude: -74.916678,
    address: "1 Court House Square, Delhi, NY, 13753"
  },
  {
    office_name: "Ticonderoga DMV Office",
    latitude: 43.848127,
    longitude: -73.422036,
    address: "132 Montcalm Street, Ticonderoga, NY, 12883"
  },
  {
    office_name: "Malone DMV Office",
    latitude: 44.849339,
    longitude: -74.295329,
    address: "355 West Main Street, Malone, NY, 12953"
  },
  {
    office_name: "Hudson DMV Office",
    latitude: 42.248167,
    longitude: -73.784596,
    address: "560 Warren Street, Hudson, NY, 12534"
  },
  {
    office_name: "Lake Pleasant DMV Office",
    latitude: 43.471998,
    longitude: -74.40286,
    address: "Route 8, Lake Pleasant, NY, 12108"
  },
  {
    office_name: "Auburn DMV Office",
    latitude: 42.929729,
    longitude: -76.569901,
    address: "160 Genesee Street, Auburn, NY, 13021"
  },
  {
    office_name: "Geneseo DMV Office",
    latitude: 42.802202,
    longitude: -77.816212,
    address: "6 Court Street, Geneseo, NY, 14454"
  },
  {
    office_name: "Flushing DMV Office",
    latitude: 40.769937,
    longitude: -73.836601,
    address: "30-56 Whitestone Expressway, Flushing, NY, 11354"
  },
  {
    office_name: "Ballston Spa DMV Office",
    latitude: 42.998908,
    longitude: -73.850503,
    address: "40 McMaster Street, Ballston Spa, NY, 12020"
  },
  {
    office_name: "Utica DMV Office",
    latitude: 43.103926,
    longitude: -75.223885,
    address: "321 Main Street, Utica, NY, 13501"
  },
  {
    office_name: "Ogdensburg DMV Office",
    latitude: 44.697518,
    longitude: -75.493973,
    address: "206-210 Ford Street, Ogdensburg, NY, 13669"
  },
  {
    office_name: "Syracuse DMV Office",
    latitude: 43.032502,
    longitude: -76.193477,
    address: "4671 Onodaga Boulevard, Syracuse, NY, 13219"
  },
  {
    office_name: "White Plains DMV Office",
    latitude: 41.034022,
    longitude: -73.769782,
    address: "200 Hamilton Avenue, White, Plains, NY, 10601"
  },
  {
    office_name: "Hornell DMV Office",
    latitude: 42.327363,
    longitude: -77.662725,
    address: "12 Allen Street, Hornell, NY, 14843"
  },
  {
    office_name: "Fonda DMV Office",
    latitude: 42.957231,
    longitude: -74.380258,
    address: "64 Broadway, Fonda, NY, 12068"
  },
  {
    office_name: "Pawling DMV Office",
    latitude: 41.561895,
    longitude: -73.601388,
    address: "20 East Main Street, Pawling, NY, 12564"
  },
  {
    office_name: "Beacon DMV Office",
    latitude: 41.506693,
    longitude: -73.973895,
    address: "223 Main Street, Beacon, NY, 12508"
  },{
    office_name: "Watkins Glen DMV Office",
    latitude: 42.377227,
    longitude: -76.871585,
    address: "105 9th Street, Watkins, Glen, NY, 14891"
  },
  {
    office_name: "Watertown DMV Office",
    latitude: 43.975194,
    longitude: -75.913959,
    address: "175 Arsenal Street, Watertown, NY, 13601"
  },
  {
    office_name: "Oneonta DMV Office",
    latitude: 42.454799,
    longitude: -75.060242,
    address: "16 South Main Street, Oneonta, NY, 13820"
  },
  {
    office_name: "Warsaw DMV Office",
    latitude: 42.74075,
    longitude: -78.134498,
    address: "6 Perry Avenue, Warsaw, NY, 14569"
  },
  {
    office_name: "Corning DMV Office",
    latitude: 42.14161,
    longitude: -77.055684,
    address: "10 West First Street, Corning, NY, 14830"
  },
  {
    office_name: "Canton DMV Office",
    latitude: 44.601774,
    longitude: -75.149204,
    address: "80 State Highway 310, Canton, NY, 13617"
  },
  {
    office_name: "Angola DMV Office",
    latitude: 42.655677,
    longitude: -79.03626,
    address: "8787 Erie Road, Angola, NY, 14006"
  },
  {
    office_name: "Saranac Lake DMV Office",
    latitude: 44.325567,
    longitude: -74.132326,
    address: "39 Main Street, Saranac Lake, NY, 12983"
  },
  {
    office_name: "Kingston DMV Office",
    latitude: 41.932704,
    longitude: -74.017723,
    address: "244 Fair Street, Kingston, NY, 12401"
  },
  {
    office_name: "Port Jefferson DMV Office",
    latitude: 40.923549,
    longitude: -73.044022,
    address: "1055 Route 112, Port Jefferson, NY, 11776"
  },
  {
    office_name: "Lyons DMV Office",
    latitude: 43.062833,
    longitude: -76.993358,
    address: "9 Pearl Street, Lyons, NY, 14489"
  },
  {
    office_name: "Catskill DMV Office",
    latitude: 42.21999,
    longitude: -73.866403,
    address: "411 Main Street, Catskill, NY, 12414"
  },
  {
    office_name: "Bethpage DMV Office",
    latitude: 40.725931,
    longitude: -73.486672,
    address: "4031 Hempstead Turnpike, Bethpage, NY, 11714"
  },
  {
    office_name: "West Haverstraw DMV Office",
    latitude: 41.20526,
    longitude: -73.985496,
    address: "50 Samsondale Plaza, West Haverstraw, NY, 10993"
  },
  {
    office_name: "Jamestown DMV Office",
    latitude: 42.095585,
    longitude: -79.24794,
    address: "512 West 3rd Street, Jamestown, NY, 14701"
  },
  {
    office_name: "Batavia DMV Office",
    latitude: 42.998605,
    longitude: -78.187941,
    address: "15 Main Street, Batavia, NY, 14020"
  },
  {
    office_name: "Port Jervis DMV Office",
    latitude: 41.374542,
    longitude: -74.690982,
    address: "20 Hammond Street, Port Jervis, NY, 12773"
  }
];
