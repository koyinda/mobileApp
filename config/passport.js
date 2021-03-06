// config/passport.js
				
// load all the things we need

var LocalStrategy   = require('passport-local').Strategy;
const connection = require("../config/database");
var bcrypt = require('bcrypt-nodejs');


// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user);
      });
      
      passport.deserializeUser(function(user, done) {
        done(null, user);
      });
	

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', 
        new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        connection.query("SELECT * FROM users WHERE userid = ?",[username],function(err,rows){
			console.log(rows);
			console.log("above row object");
			if (err)
                return done(err);
			 if (1==2) {
                return done(null, false, req.flash('signupMessage', 'That userid does not exist.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUserMysql = {
				
                username: username,
                password: bcrypt.hashSync(password, null, null)
                }; // use the generateHash function in our user model
			
				var insertQuery = "update users set password = ? where userid = ?";
					console.log(insertQuery+ " "+ newUserMysql.username);
				connection.query({sql: insertQuery,timeout: 40000 },[newUserMysql.password, newUserMysql.username],function(err,rows){
				newUserMysql.id = rows.updateId;
				
				return done(null, newUserMysql);
				});	
            }	
		});
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with email and password from our form

         connection.query("select * from users, userdetails, autoregaccounts where users.USERINDEX = userdetails.USERINDEX and users.PRODUCTINDEX = autoregaccounts.AUTOREGACCOUNTINDEX and users.USERID = ?",[username],function(err,rows){
			if (err)
                return done(err);
			 if (!rows.length) {
                 
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            } 
			
			// if the user is found but the password is wrong
            if (!bcrypt.compareSync(password, rows[0].PASSWORD))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
			
            // all is well, return successful user
            return done(null, rows[0]);			
		
		});
		


    }));

};