var MongoClient = require('mongodb').MongoClient,
	settings = require('./config.js'),
	Guid = require('Guid'),
	bcrypt = require("bcrypt-nodejs");


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

        exports.findUserByUserNameAndPassword = function(username, password) {
        	return userCollection.find({username: username}).limit(1).toArray().then(function(listOfUser) {
        		if(listOfUser.length === 0) {
        			return Promise.reject("User doesn't exist!");
        		} else {
        			var user = listOfUser[0];
        			if(bcrypt.compareSync(password, user.encryptedPassword)){
						return user;
					} else {
						return Promise.reject("Password doesn't match!");
					}
        		}
        	});
        };

        exports.findUserByUserName = function(username) {
        	return userCollection.find({username: username}).limit(1).toArray().then(function(listOfUser) {
        		if(listOfUser.length === 0) {
        			return Promise.reject("User doesn't exist!");
        		} else {
        			return Promise.accept("User exists");
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
