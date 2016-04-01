// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var bcrypt = require("bcrypt-nodejs");
var userData = require('./data.js');
var Guid = require('Guid');

// This package exports the function to create an express instance:
var app = express();

// We can setup Jade now!
app.set('view engine', 'ejs');

// This is called 'adding middleware', or things that will help parse your request
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// This middleware will activate for every request we make to 
// any path starting with /assets;
// it will check the 'static' folder for matching files 
app.use('/assets', express.static('static'));

// Setup your routes here!

app.get("/", function (request, response) { 
    if(!request.cookies["session"]) {
		response.render("pages/login", { pageTitle: "User Profile System" });
	} else {
		userData.findUserBySessionId(request.cookies["session"]).then(function(user){
			response.redirect("/profile");
		}, function() {
			// session expired. clear cookies
			var expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours()-1);
			response.cookie("session", "", { expires: expiresAt });
			response.clearCookie("session");
			response.render("pages/login", { pageTitle: "User Profile System" });
		});
	}
});

app.get("/profile", function (request, response) { 
	if(!request.cookies["session"]) {
		response.redirect("/");
	} else {
		userData.findUserBySessionId(request.cookies["session"]).then(function(user){
			var profile = user["profile"];
    		response.render("pages/profile", { pageTitle: "User Profile", profile: profile});
		}, function() {
			// session expired. clear cookies
			//console.log("session expired");
			var expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours()-1);
			response.cookie("session", "", { expires: expiresAt });
			response.clearCookie("session");
			response.redirect("/");
		});
	}
});

app.post("/updateProfile", function (request, response) { 
	if(!request.cookies["session"]) {
		response.redirect("/");
	} else {
		userData.findUserBySessionId(request.cookies["session"]).then(function(user){
			var newProfile = {firstName: request.body.firstname, lastName: request.body.lastname, hobby: request.body.hobby, petName: request.body.petname};
			userData.updateProfile(request.cookies["session"], newProfile).then(function() {
				response.redirect("/profile");
			});
		}, function() {
			// session expired. clear cookies
			var expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours()-1);
			response.cookie("session", "", { expires: expiresAt });
			response.clearCookie("session");
			response.redirect("/");
		});
	}
});

app.post("/login", function (request, response) { 
	if(!request.body.username || !request.body.password) {
		response.render("pages/home", {pageTitle: "User name and password cannot be empty."});
	}
	userData.findUserByUserNameAndPassword(request.body.username, request.body.password).then(function(user) {
		// matched. create a new session id
		sessionId = Guid.create().toString();
		userData.updateSession(request.body.username, sessionId);

		// create a cookie
		var expireAt = new Date();
      	expireAt.setHours(expireAt.getHours()+2);
        response.cookie("session", sessionId, { expires: expireAt });

        // store user
        response.locals.user = user;
        //console.log(user);

        response.redirect("/profile");
	}, function(error) {
		//console.log(error);
		response.render("pages/home", {pageTitle: error});
	});
});

app.post("/signup", function (request, response) {
	if(!request.body.username || !request.body.password) {
		response.render("pages/home", {pageTitle: "User name and password cannot be empty."});
	}
	// check if the user name exists
	userData.findUserByUserName(request.body.username).then(function() {
		// if exists, reject
		//console.log("User name exists!");
		//response.redirect("/")
    	response.render("pages/home", {pageTitle: "User name exists."});
	}, function() {
		// if not, create a new user
		var encryptedPassword = bcrypt.hashSync(request.body.password);
		userData.createUser(request.body.username, encryptedPassword);
		response.redirect("/")
	});
});

app.post("/logout", function (request, response) { 
	var expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours()-1);
	response.cookie("session", "", { expires: expiresAt });
	response.clearCookie("session");
	response.locals.user = undefined;
	response.redirect("/");
});

// We can now navigate to localhost:3000
app.listen(3000, function () {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
