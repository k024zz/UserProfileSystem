var MongoClient = require('mongodb').MongoClient,
	settings = require('./config.js'),
	Guid = require('Guid');


var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        var userCollection = db.collection("user");
        
        exports.createUser = function(username, encryptedPassword) {
        	emptyProfile = {firstName: "", lastName: "", hobby: "", petName: ""};
        	//console.log("good");
        	return userCollection.insertOne({ _id: Guid.create().toString(), username: username, encryptedPassword: encryptedPassword, currentSessionId: "", profile: emptyProfile });
        };

        exports.updateSession = function(username, sessionId) {
        	return userCollection.updateOne({ username: username}, { $set: {currentSessionId: sessionId} }).then(function() {
        		return exports.findUserByUserName(username);
        	});
        };

        exports.updateProfile = function(sessionId, profile) {
        	return userCollection.updateOne({ currentSessionId: sessionId}, { $set: {profile: profile} }).then(function() {
        		return exports.findUserBySessionId(sessionId);
        	});
        };

        exports.findUserByUserName = function(username) {
        	return userCollection.find({username: username}).limit(1).toArray().then(function(listOfUser) {
        		if(listOfUser.length === 0) {
        			return Promise.reject("User doesn't exist!");
        		} else {
        			return listOfUser[0];
        		}
        	});
        };

        exports.findUserBySessionId = function(sessionId) {
        	return userCollection.find({currentSessionId: sessionId}).limit(1).toArray().then(function(listOfUser) {
        		if(listOfUser.length === 0) {
        			return Promise.reject("Session doesn't exist!");
        		} else {
        			return listOfUser[0];
        		}
        	});
        };
    });
