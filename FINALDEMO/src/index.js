/*
  MyDMV Alexa Skill.
  This is the MyDMV Alexa Skill developed for the New York State Department of Motor Vehicles (NYS DMV)
  built with the Amazon Alexa Skills Kit. The Intent Schema, Custom Slots, and Sample Utterances for this skill
  on the NYS ITS GitHub repository located at
  Developed by Nicholas Stucchi
  Developed on July 11, 2017
  Modified on July 26, 2017
*/

'use strict';

var driver = require('./driverQuestions');
var motor = require('./motorQuestions');
var locations = require('./dmv');
var counties = require('./county');

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

    if (event.session.application.applicationId !== "amzn1.ask.skill.94246fa0-266e-4fcd-922b-9c85751893e2") {
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
  if ("WhatsNewIntent" === intentName) {
    whatIsNew(intent, session, callback);
  } else if ("MoreInfoIntent" === intentName) {
    moreInfo(intent, session, callback);
  } else if ("OfficeSearchIntent" === intentName) {
    officeSearch(intent, session, callback);
  } else if ("AvailableCountiesIntent" === intentName) {
    availableCounties(intent, session, callback);
  } else if ("CountySearchIntent" === intentName) {
    countySearch(intent, session, callback);
  } else if ("OfficeIntent" === intentName) {
    handleDMVOffice(intent, session, callback);
  } else if ("LocationIntent" === intentName) {
    handleDMVLocation(intent, session, callback);
  } else if ("HoursIntent" === intentName) {
    handleDMVHours(intent, session, callback);
  } else if ("SettingsIntent" === intentName) {
    quizSettings(intent, session, callback);
  } else if ("SetGameLengthIntent" === intentName) {
    setGameLength(intent, session, callback);
  } else if ("WhichQuizIntent" === intentName) {
    whichQuiz(intent, session, callback);
  } else if ("DriverQuizIntent" === intentName) {
    handleDriverQuiz(intent, session, callback);
  } else if ("MotorQuizIntent" === intentName) {
    handleMotorQuiz(intent, session, callback);
  } else if ("NumberIntent" === intentName) {
    if (previousPlace === "Driver Quiz" || previousPlace === "Driver Answer") {
      handleDriverAnswer(intent, session, callback);
    } else if (previousPlace === "Motor Quiz" || previousPlace === "Motor Answer") {
      handleMotorAnswer(intent, session, callback);
    } else if (previousPlace === "Quiz Settings") {
      setGameLength(intent, session, callback);
    }
  } else if ("DontKnowIntent" === intentName) {
    if (previousPlace === "Driver Quiz" || previousPlace === "Driver Answer") {
      handleDriverAnswer(intent, session, callback);
    } else if (previousPlace === "Motor Quiz" || previousPlace === "Motor Answer") {
      handleMotorAnswer(intent, session, callback);
    } else {
      getHelp(intent, session, callback);
    }
  } else if ("AMAZON.RepeatIntent" === intentName) {
    handleRepeat(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    if (previousPlace === "Which Quiz" || previousPlace === "Driver Quiz" || previousPlace === "Driver Answer" || previousPlace === "Motor Quiz" || previousPlace === "Motor Answer") {
      quizHelp(intent, session, callback);
    } else if (previousPlace === "Search For Office" || previousPlace === "Available Counties" || previousPlace === "What County" || previousPlace === "County Search" || previousPlace === "DMV Office" || previousPlace === "DMV Location" || previousPlace === "DMV Hours") {
      getDMVHelp(intent, session, callback);
    } else {
      getHelp(intent, session, callback);
    }
  } else if ("AMAZON.YesIntent" === intentName) {
    if (previousPlace === "Whats New") {
      moreInfo(intent, session, callback);
    } else if (previousPlace === "More Info" || previousPlace === "DMV Office" || previousPlace === "DMV Location" || previousPlace === "DMV Hours") {
      anythingElse(intent, session, callback);
    } else if (previousPlace === "Search For Office") {
      whatCounty(intent, session, callback);
    } else if (previousPlace === "Available Counties") {
      availableCounties(intent, session, callback);
    } else if (previousPlace === "Set Game Length" || previousPlace === "Quiz Help") {
      whichQuiz(intent, session, callback);
    } else if (previousPlace === "Driver Answer") {
      handleDriverAnswer(intent, session, callback);
    } else if (previousPlace === "Motor Answer") {
      handleMotorAnswer(intent, session, callback);
    }
  } else if ("AMAZON.NoIntent" === intentName) {
    if (previousPlace === "Search For Office") {
      availableCounties(intent, session, callback);
    } else if (previousPlace === "Available Counties") {
      whatCounty(intent, session, callback);
    } else if (previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.StopIntent" === intentName) {
    if (previousPlace === "Available Counties") {
      whatCounty(intent, session, callback);
    } else if (previousPlace === "Driver Quiz" || previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (previousPlace === "Motor Quiz" || previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.CancelIntent" === intentName) {
    if (previousPlace === "Driver Quiz" || previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (previousPlace === "Motor Quiz" || previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
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
var GAME_LENGTH = 5;
var ANSWER_COUNT = 4;

function quizSettings(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Quiz Settings Menu";
  var speechOutput = "Driver and motorcycle permit quizzes are set to " + GAME_LENGTH.toString() + " questions by default. If you so choose you can set a new game length by saying, set game length to, and any number from 2 to 20. ";
  var repromptText = "Say, set game length to, in order to change the game length from " + GAME_LENGTH.toString() + " questions? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Quiz Settings"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function setGameLength(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Set Game Length";
  var number = intent.slots.Number.value;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!number) {
    GAME_LENGTH = 5;
    speechOutput = "I'm sorry, I didn't quite understand what you wanted to change the game length to. It remains set at " + GAME_LENGTH.toString() + ". Please try again. ";
    repromptText = "To try and set the game length again say, set game length to, and any number between 2 and 20. Please try again. ";
  } else {
    GAME_LENGTH = number;

    speechOutput = "The game length is now set to " + GAME_LENGTH.toString() + ". Would you like to start a quiz? ";
    repromptText = "Would you like to start a quiz? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Set Game Length"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Welcome To The MyDMV Alexa Skill";
  var speechOutput = "Welcome to the My DMV Alexa Skill. I can update you on new information regarding: Inspections, Registrations, and License Renewals. "
  + "I can also quiz you for the written permit test. Or give you information regarding DMV Office locations and hours. "
  + "To find out new information you can say, what's new. To quiz yourself for the permit test you can say, quiz me. "
  + "Or to hear about DMV Office information say, tell me about the, and the office you wish to hear about. What would you like to do?  ";
  var repromptText = "What would you like to do?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatIsNew(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Is New";
  var speechOutput = "Your inspection for passenger plate, A B C 1 2 3, expired July 1.  "
  + "Your boat registration for, N Y 1 2 3 4 5, will expire on August 1.  "
  + "Your driver's license will expire next month, you are eligible to renew it online.  "
  + "Would you like to learn more about renewing your license online?  ";
  var repromptText = "Would you like to learn more about renewing your license online?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Whats New"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function moreInfo(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Online License Renewals";
  var speechOutput = "To renew your license online follow these steps:  "
  + "Step 1, pass an eye test by an approved provider, like a pharmacy. Or have a professional complete a paper report.  "
  + "Step 2, follow the online renewal steps on the DMV website.  "
  + "And, step 3, download and print a temporary license, in PDF format to use until your new license arrives.  "
  + "If you would like more in depth information, please visit the DMV website.  "
  + "Is there anything else I can help you with today?  ";
  var repromptText = "Is there anything else I can help you with today?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "More Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function anythingElse(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Else Can I Do For You?";
  var speechOutput = "What else would you like to know? You can say what's new to hear new information about your:  "
  + "Inspections, Registrations, and License Renewals.  "
  + "To hear information about a DMV office say, tell me about the, and the office you wish to hear about. "
  + "You can also take a quiz for the written permit test by saying, quiz me. ";
  + "Or you can say, stop to exit. What would you like to do? ";
  var repromptText = "Say, what's new for new information. Say, tell me about the, and the office you wish to hear about. "
  + "Or say, quiz me to prepare for the written permit test. Or say, stop to exit. What would you like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Anything Else"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function officeSearch(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Search For DMV Office";
  var speechOutput = "If you don't know exactly what office you want to hear about, you search for offices by New York County. To search for offices say, is there an office in, and the county you are searching in. Do you know what county you want to search in?  ";
  var repromptText = "Do you know what county you want to search in?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Search For Office"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function availableCounties(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "NY County's";
  var speechOutput = "You can search for offices within the following counties, if you hear the county you wish to search in say, stop. "
  + "Albany, Allegany, Bronx, Broome, Cattaraugus, Cayuga, Chautauqua, Chemung, Chenango, Clinton, "
  + "Columbia, Cortland, Delaware, Dutchess, Erie, Essex, Franklin, Fulton, Genesee, Greene, "
  + "Hamilton, Herkimer, Jefferson, Kings, Lewis, Livingston, Madison, Monroe, Montgomery, "
  + "Nassau, New York, Niagara, Oneida, Onodaga, Ontario, Orange, Orleans, Ostego, Oswego, "
  + "Putnam, Queens, Rensselaer, Richmond, Rockland, Saratoga, Schenectady, Schoharie, Schuyler, "
  + "Seneca, Saint Lawrence, Steuben, Suffolk, Tompkins, Ulster, Warren, Washington, "
  + "Wayne, Westchester, Wyoming, and Yates County. "
  + "Do you need to hear this list again?  ";
  var repromptText = "Do you need to hear the County list again?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Available Counties"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatCounty(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What County?";
  var speechOutput = "What county do you want to search for a DMV Office in?  ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What County"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function countySearch(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Search For DMV Office By County";
  var county = intent.slots.County.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!counties[county]) {
    speechOutput = "I'm sorry, I didn't understand what County you wanted to know about. Please try again, or ask about another County.  ";
    repromptText = "Try asking again, or about another County.  ";
  } else {
    var office_list = counties[county].names;
    speechOutput = "The following Offices are located within " + county + ": " + office_list + ". "
    + "If the office you want to know about has been listed say, tell me about, and the name of the office. If not say the county again to hear the list another time.  ";
    repromptText = "Say the tell me about, and the office you wish to hear about. Or say the county name again to hear the list another time.  ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "County Search"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleDMVOffice(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "NYS DMV Office";
  var office = intent.slots.Office.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!locations[office]) {
    speechOutput = "I'm sorry, I didn't understand what DMV Office you wanted to know about. Please try again, or ask about another DMV Office.  ";
    repromptText = "Try asking again, or about another office.  ";
  } else {
    var office_name = locations[office].office_name;
    var address = locations[office].street_address_line_1;
    var city = locations[office].city;
    var state = locations[office].state;
    var zip = locations[office].zip_code;
    var mon_hrs = locations[office].mon_hrs;
    var tue_hrs = locations[office].tue_hrs;
    var wed_hrs = locations[office].wed_hrs;
    var thurs_hrs = locations[office].thurs_hrs;
    var fri_hrs = locations[office].fri_hrs;
    var sat_hrs = locations[office].sat_hrs;
    var longitude = locations[office].longitude;
    var latitude = locations[office].latitude;

    speechOutput = "The " + office_name + " DMV Office is located at " + address + ", " + city + ", " + state + " " + zip + ". And its hours of operation are as follows. "
    + "Monday: " + mon_hrs + ". " + "Tuesday: " + tue_hrs + ". " + "Wednesday: " + wed_hrs + ". " + "Thursday: " + thurs_hrs + ". " + "Friday: " + fri_hrs + ". " + "Saturday: " + sat_hrs + ". "
    + "Is there anything else I can help you with today?  ";
    repromptText = "Is there anything else I can help you with today?  ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Office"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleDMVLocation(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "NYS DMV Locations";
  var office = intent.slots.Office.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!locations[office]) {
    speechOutput = "I'm sorry, I didn't understand what DMV Office you wanted to know about. Please try again, or ask about another DMV Office.  ";
    repromptText = "Try asking again, or about another office.  ";
  } else {
    var office_name = locations[office].office_name;
    var address = locations[office].street_address_line_1;
    var city = locations[office].city;
    var state = locations[office].state;
    var zip = locations[office].zip_code;

    speechOutput = "The " + office_name + " DMV is located at " + address + ", " + city + ", " + state + " " + zip + ". Is there anything else I can help you with?  ";
    repromptText = "Is there anything else I can help you with?  ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Location"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleDMVHours(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "NYS DMV Hours";
  var office = intent.slots.Office.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!locations[office]) {
    speechOutput = "I'm sorry, I didn't understand what DMV Office you wanted to know about. Please try again, or ask about another DMV Office.  ";
    repromptText = "Try asking again, or about another office.  ";
  } else {
    var office_name = locations[office].office_name;
    var mon_hrs = locations[office].mon_hrs;
    var tue_hrs = locations[office].tue_hrs;
    var wed_hrs = locations[office].wed_hrs;
    var thurs_hrs = locations[office].thurs_hrs;
    var fri_hrs = locations[office].fri_hrs;
    var sat_hrs = locations[office].sat_hrs;

    speechOutput = "The " + office_name + " DMV's hours are as follows. Monday: " + mon_hrs + ". Tuesday: " + tue_hrs + ". Wednesday: " + wed_hrs + ". Thursday: " + thurs_hrs + ". Friday: " + fri_hrs
    + ". Saturday: " + sat_hrs + ". Is there anything else I can help you with?  ";
    repromptText = "Is there anything else I can help you with?  ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Hours"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whichQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Which Quiz Would You Like To Take?";
  var speechOutput = "Are you preparing for your driver permit, or, motorcycle permit?  ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Which Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleDriverQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Driver Permit Quiz";
  var speechOutput = "Hello, I will ask you " + GAME_LENGTH.toString() + " questions. Just say the number of the answer you think is correct. Let's start.  ";
  var shouldEndSession = false;
  var driverGameQuestions = getDriverQuestions();
  var driverCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
  var driverRoundAnswers = getDriverAnswers(driverGameQuestions, 0, driverCorrectAnswerIndex);
  var driverCurrentQuestionIndex = 0;
  var driverSpokenQuestion = Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0];
  var repromptText = "Question 1: " + driverSpokenQuestion + " ";

  for (var i = 0; i < ANSWER_COUNT; i++) {
    repromptText += (i + 1).toString() + ". " + driverRoundAnswers[i] + ". ";
  }

  speechOutput += repromptText;

  sessionAttributes = {
    "speechOutput": repromptText,
    "repromptText": repromptText,
    "driverCurrentQuestionIndex": driverCurrentQuestionIndex,
    "driverCorrectAnswerIndex": driverCorrectAnswerIndex + 1,
    "driverQuestions": driverGameQuestions,
    "driverScore": 0,
    "driverCorrectAnswerText": driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0]][0],
    "previousPlace": "Driver Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getDriverQuestions() {
  var driverGameQuestions = [];
  var driverIndexList = [];
  var driverIndex = driver.DRIVER_QUESTIONS.length;

  if (GAME_LENGTH > driverIndex) {
    throw "Invalid Game Length";
  }

  for (var i = 0; i < driver.DRIVER_QUESTIONS.length; i++) {
    driverIndexList.push(i);
  }

  // Pick GAME_LENGTH random question from the list to ask the user, make sure there are no repeats.
  for (var j = 0; j < GAME_LENGTH; j++) {
    var driverRand = Math.floor(Math.random() * driverIndex);
    driverIndex -= 1;

    var driverTemp = driverIndexList[driverIndex];
    driverIndexList[driverIndex] = driverIndexList[driverRand];
    driverIndexList[driverRand] = driverTemp;
    driverGameQuestions.push(driverIndexList[driverIndex]);
  }

  return driverGameQuestions;
}

function getDriverAnswers(driverGameQuestionIndexes, driverCorrectAnswerIndex, driverCorrectAnswerTargetLocation) {
  /*
    Get the answer for a given question, and place the correct answer at the spot marked by the
    correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    only ANSWER_COUNT will be selected.
  */

  var driverAnswers = [];
  var driverAnswersCopy = driver.DRIVER_QUESTIONS[driverGameQuestionIndexes[driverCorrectAnswerIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestionIndexes[driverCorrectAnswerIndex]])[0]];
  var driverIndex = driverAnswersCopy.length;
  var driverTemp;

  if (driverIndex < ANSWER_COUNT) {
    throw "Not Enough Answers For Question";
  }

  // Shuffle the answers, excluding the first element.
  for (var j = 1; j < driverAnswersCopy.length; j++) {
    var driverRand = Math.floor(Math.random() * (driverIndex - 1)) + 1;
    driverIndex -= 1;

    driverTemp = driverAnswersCopy[driverIndex];
    driverAnswersCopy[driverIndex] = driverAnswersCopy[driverRand];
    driverAnswersCopy[driverRand] = driverTemp;
  }

  // Swap the correct answer into the target location.
  for (var i = 0; i < ANSWER_COUNT; i++) {
    driverAnswers[i] = driverAnswersCopy[i];
  }

  driverTemp = driverAnswers[0];
  driverAnswers[0] = driverAnswers[driverCorrectAnswerTargetLocation];
  driverAnswers[driverCorrectAnswerTargetLocation] = driverTemp;

  return driverAnswers;
}

function handleDriverAnswer(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Driver Permit Quiz";
  var speechOutput = "";
  var driverAnswerSlotValid = isDriverAnswerSlotValid(intent);
  var userGaveUp = intent.name === "DontKnowIntent";

  if (!driverAnswerSlotValid && !userGaveUp) {
    // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
    // return an error message to the user. Remember to guide the user into providing correct values.
    var reprompt = session.attributes.speechOutput;
    speechOutput = "I'm sorry I didn't quite understand. Remember your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". " + reprompt;
    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
  } else {
    var driverGameQuestions = session.attributes.driverQuestions;
    var driverCorrectAnswerIndex = parseInt(session.attributes.driverCorrectAnswerIndex);
    var driverCurrentScore = parseInt(session.attributes.driverScore);
    var driverCurrentQuestionIndex = parseInt(session.attributes.driverCurrentQuestionIndex);
    var driverCorrectAnswerText = session.attributes.driverCorrectAnswerText;
    var speechOutputAnalysis = "";

    if (driverAnswerSlotValid && parseInt(intent.slots.Number.value) === driverCorrectAnswerIndex) {
      driverCurrentScore++;
      speechOutputAnalysis = "correct!  ";
    } else {
      if (!userGaveUp) {
        speechOutputAnalysis = "incorrect!  ";
      }
      speechOutputAnalysis += "The correct answer is " + driverCorrectAnswerIndex + ": " + driverCorrectAnswerText + ". ";
    }

    // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can ask the user to keep going or stop.
    if (driverCurrentQuestionIndex == GAME_LENGTH - 1) {
      speechOutput = userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "You got " + driverCurrentScore.toString() + " out of " + GAME_LENGTH.toString() + " questions correct. Would you like to play another round?  ";
      var resetGameLength = 5;
      GAME_LENGTH = resetGameLength;
      callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "Would you like to play another round?  ", false));
    } else {
      driverCurrentQuestionIndex += 1;
      var driverSpokenQuestion = Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0];
      driverCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
      var driverRoundAnswers = getDriverAnswers(driverGameQuestions, driverCurrentQuestionIndex, driverCorrectAnswerIndex);
      var driverQuestionIndexForSpeech = driverCurrentQuestionIndex + 1;
      var repromptText = "Question " + driverQuestionIndexForSpeech.toString() + ". " + driverSpokenQuestion + ". ";

      for (var i = 0; i < ANSWER_COUNT; i++) {
        repromptText += (i + 1).toString() + ". " + driverRoundAnswers[i] + ". ";
      }

      speechOutput += userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "Your score is " + driverCurrentScore.toString() + ". " + repromptText;

      sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "driverCurrentQuestionIndex": driverCurrentQuestionIndex,
        "driverCorrectAnswerIndex": driverCorrectAnswerIndex + 1,
        "driverQuestions": driverGameQuestions,
        "driverScore": driverCurrentScore,
        "driverCorrectAnswerText": driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0]][0],
        "previousPlace": "Driver Answer"
      };

      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    }
  }
}

function handleMotorQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Motorcycle Permit Quiz";
  var speechOutput = "Hello, I will ask you " + GAME_LENGTH.toString() + " questions. Just say the number of the answer you think is correct. Let's start.  ";
  var shouldEndSession = false;
  var motorGameQuestions = getMotorQuestions();
  var motorCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
  var motorRoundAnswers = getMotorAnswers(motorGameQuestions, 0, motorCorrectAnswerIndex);
  var motorCurrentQuestionIndex = 0;
  var motorSpokenQuestion = Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0];
  var repromptText = "Question 1: " + motorSpokenQuestion + " ";

  for (var i = 0; i < ANSWER_COUNT; i++) {
    repromptText += (i + 1).toString() + ". " + motorRoundAnswers[i] + ". ";
  }

  speechOutput += repromptText;

  sessionAttributes = {
    "speechOutput": repromptText,
    "repromptText": repromptText,
    "motorCurrentQuestionIndex": motorCurrentQuestionIndex,
    "motorCorrectAnswerIndex": motorCorrectAnswerIndex + 1,
    "motorQuestions": motorGameQuestions,
    "motorScore": 0,
    "motorCorrectAnswerText": motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0]][0],
    "previousPlace": "Motor Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getMotorQuestions() {
  var motorGameQuestions = [];
  var motorIndexList = [];
  var motorIndex = motor.MOTOR_QUESTIONS.length;

  if (GAME_LENGTH > motorIndex) {
    throw "Invalid Game Length";
  }

  for (var i = 0; i < motor.MOTOR_QUESTIONS.length; i++) {
    motorIndexList.push(i);
  }

  // Pick GAME_LENGTH random question from the list to ask the user, make sure there are no repeats.
  for (var j = 0; j < GAME_LENGTH; j++) {
    var motorRand = Math.floor(Math.random() * motorIndex);
    motorIndex -= 1;

    var motorTemp = motorIndexList[motorIndex];
    motorIndexList[motorIndex] = motorIndexList[motorRand];
    motorIndexList[motorRand] = motorTemp;
    motorGameQuestions.push(motorIndexList[motorIndex]);
  }

  return motorGameQuestions;
}

function getMotorAnswers(motorGameQuestionIndexes, motorCorrectAnswerIndex, motorCorrectAnswerTargetLocation) {
  /*
    Get the answer for a given question, and place the correct answer at the spot marked by the
    correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    only ANSWER_COUNT will be selected.
  */

  var motorAnswers = [];
  var motorAnswersCopy = motor.MOTOR_QUESTIONS[motorGameQuestionIndexes[motorCorrectAnswerIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestionIndexes[motorCorrectAnswerIndex]])[0]];
  var motorIndex = motorAnswersCopy.length;
  var motorTemp;

  if (motorIndex < ANSWER_COUNT) {
    throw "Not Enough Answers For Question";
  }

  // Shuffle the answers, excluding the first element.
  for (var j = 1; j < motorAnswersCopy.length; j++) {
    var motorRand = Math.floor(Math.random() * (motorIndex - 1)) + 1;
    motorIndex -= 1;

    motorTemp = motorAnswersCopy[motorIndex];
    motorAnswersCopy[motorIndex] = motorAnswersCopy[motorRand];
    motorAnswersCopy[motorRand] = motorTemp;
  }

  // Swap the correct answer into the target location.
  for (var i = 0; i < ANSWER_COUNT; i++) {
    motorAnswers[i] = motorAnswersCopy[i];
  }

  motorTemp = motorAnswers[0];
  motorAnswers[0] = motorAnswers[motorCorrectAnswerTargetLocation];
  motorAnswers[motorCorrectAnswerTargetLocation] = motorTemp;

  return motorAnswers;
}

function handleMotorAnswer(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Motorcycle Permit Quiz";
  var speechOutput = "";
  var motorAnswerSlotValid = isMotorAnswerSlotValid(intent);
  var userGaveUp = intent.name === "DontKnowIntent";

  if (!motorAnswerSlotValid && !userGaveUp) {
    // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
    // return an error message to the user. Remember to guide the user into providing correct values.
    var reprompt = session.attributes.speechOutput;
    speechOutput = "I'm sorry I didn't quite understand. Remember your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". " + reprompt;
    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
  } else {
    var motorGameQuestions = session.attributes.motorQuestions;
    var motorCorrectAnswerIndex = parseInt(session.attributes.motorCorrectAnswerIndex);
    var motorCurrentScore = parseInt(session.attributes.motorScore);
    var motorCurrentQuestionIndex = parseInt(session.attributes.motorCurrentQuestionIndex);
    var motorCorrectAnswerText = session.attributes.motorCorrectAnswerText;
    var speechOutputAnalysis = "";

    if (motorAnswerSlotValid && parseInt(intent.slots.Number.value) === motorCorrectAnswerIndex) {
      motorCurrentScore++;
      speechOutputAnalysis = "correct!  ";
    } else {
      if (!userGaveUp) {
        speechOutputAnalysis = "incorrect!  ";
      }
      speechOutputAnalysis += "The correct answer is " + motorCorrectAnswerIndex + ": " + motorCorrectAnswerText + ". ";
    }

    // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can ask the user to keep going or stop.
    if (motorCurrentQuestionIndex == GAME_LENGTH - 1) {
      speechOutput = userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "You got " + motorCurrentScore.toString() + " out of " + GAME_LENGTH.toString() + " questions correct. Would you like to play another round?  ";
      var resetGameLength = 5;
      GAME_LENGTH = resetGameLength;
      callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "Would you like to play another round?  ", false));
    } else {
      motorCurrentQuestionIndex += 1;
      var motorSpokenQuestion = Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0];
      motorCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
      var motorRoundAnswers = getMotorAnswers(motorGameQuestions, motorCurrentQuestionIndex, motorCorrectAnswerIndex);
      var motorQuestionIndexForSpeech = motorCurrentQuestionIndex + 1;
      var repromptText = "Question " + motorQuestionIndexForSpeech.toString() + ". " + motorSpokenQuestion + ". ";

      for (var i = 0; i < ANSWER_COUNT; i++) {
        repromptText += (i + 1).toString() + ". " + motorRoundAnswers[i] + ". ";
      }

      speechOutput += userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "Your score is " + motorCurrentScore.toString() + ". " + repromptText;

      sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "motorCurrentQuestionIndex": motorCurrentQuestionIndex,
        "motorCorrectAnswerIndex": motorCorrectAnswerIndex + 1,
        "motorQuestions": motorGameQuestions,
        "motorScore": motorCurrentScore,
        "motorCorrectAnswerText": motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0]][0],
        "previousPlace": "Motor Answer"
      };

      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    }
  }
}

function handleRepeat(intent, session, callback) {
  /*
    Repeat the previous speechOutput and repromptText from the session attributes if available
    else start a new game session.
  */
  if (!session.attributes || !session.attributes.speechOutput) {
    getWelcomeResponse(callback);
  } else {
    callback(session.attributes, buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
  }
}

function getHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "MyDMV Help";
  var speechOutput = "I can tell you about new information regarding the status of your inspections, registrations, and license renewals.  "
  + "Just say, what's new or say, update me, to hear all about this new information!  "
  + "To hear about DMV Office information say, tell me about the, and the office you would like to hear about.  "
  + "If you are practicing for the written permit test, I can also help you get ready by quizzing you!  "
  + "To start a quiz all you have to say is quiz me, or you can say start a quiz.  "
  + "If you would like more in depth help on how to take a quiz, say, quiz info.  "
  + "Or you can say, stop to exit. What would you like to do?  ";
  var repromptText = "What would you like to do?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Get Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getDMVHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "MyDMV Office Help";
  var speechOutput = "If you don't know which office you are looking for, you can search for offices by county. To hear what counties you can search for say, what are the available counties? "
  + "To search for offices by county you can say, what offices are in, and the county you wish to search in. "
  + "You can say, tell me about, and the DMV office you want to hear about for an overview of its address and hours of operation. For example, you can say, tell me about the Oswego office. "
  + "Or you can get just the address, or hours of operation. To find out the address of an office say, where is the, and the office of your choice. For example, you can say, where is the clifton park office? "
  + "And to hear just the hours of operation say what are the, and the office. For example, you can say, what are the belmont office hours?  "
  + "Would you like to search for a DMV Office?  ";
  var repromptText = "Would you like to search for a DMV Office?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Office Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function quizHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "MyDMV Permit Quiz Help";
  var speechOutput = "I will get you ready to take the test for both driver and motorcycle permits!  "
  + "The quiz is easy to take, you can say, quiz me and I will ask you which quiz you would like to take.  "
  + "Or you can jump right into it by saying, quiz me for the driver permit. Or by saying, quiz me for the motorcycle permit.  "
  + "Each quiz is set up as " + GAME_LENGTH.toString() + " questions per round, and " + ANSWER_COUNT.toString() + " answers per question.  "
  + "You can change the number of questions asked by saying, set game length to, or change game length to, and any number between 2 and 20. "
  + "Questions are varied by round, and the answers will be in a different spot each time, so make sure to really listen to the question!  "
  + "Once I read through the question and answers, you can answer by saying the number of the answer choice you think is the correct one.  "
  + "For the motorcycle quiz you need to say, the answer is, or my answer is, before the number of the answer you think is correct.  "
  + "For the driver quiz all you have to say is the number of the answer you think is correct, or you can say, i think it's, then the number of the answer you think is correct.  "
  + "And if you need to hear a question again, all you have to say is repeat that, or repeat that question.  "
  + "When the round is over you can say, yes to play another round, or you can say, no, to exit.  "
  + "Would you like to start a quiz now?  ";
  var repromptText = "Do you need me to repeat this information again?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Quiz Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Have a wonderful day!", "", true));
}

function endSessionFromDriverQuiz(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Good luck on your driver permit test!", "", true));
}

function endSessionFromMotorQuiz(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Good luck on your motorcycle permit test!", "", true));
}

function isDriverAnswerSlotValid(intent) {
  var driverAnswerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var driverAnswerSlotIsInt = driverAnswerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return driverAnswerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
}

function isMotorAnswerSlotValid(intent) {
  var motorAnswerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var motorAnswerSlotIsInt = motorAnswerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return motorAnswerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
}

function isAnswerSlotValid(intent) {
  var answerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return answerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
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

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
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
