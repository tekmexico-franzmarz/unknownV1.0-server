var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.secretOrKey = 'chatserver';

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/UserSchema');

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================


    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================


    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {

                User.findOne({
                    'local.email': req.body.email
                }, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, {
                            message: "That email is already taken."
                        });
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.email = req.body.email;
                        newUser.fullName = req.body.fullName;
                        newUser.username = req.body.username;
                        newUser.locale = req.body.locale;
                        newUser.status = req.body.status;
                        newUser.conversations = req.body.conversations;
                        newUser.contacts = req.body.contacts;
                        newUser.notifications = req.body.notifications;
                        newUser.groups = req.body.groups;
                        newUser.createdAt = req.body.createdAt;
                        newUser.updatedAt = req.body.updatedAt;
                        newUser.password = newUser.generateHash(password);
                        newUser.token = "";

                        // save the user
                        newUser.save(function (err) {
                            if (err) throw err;
                            return done(null, newUser);
                        });
                    }

                });

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    /* passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) { // callback with email and password from our form
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({
                'username': req.body.email
            }, function (err, user) {
                //console.log("User=",user)

                //console.log("Inside LOCAL-LOGIN || user.password=", user.password);
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, {
                        message: 'Incorrect username.'
                    }); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(req.body.password)) {
                    //console.error("Wrong Password");
                    return done(null, false, {
                        message: 'Incorrect password.'
                    }); // create the loginMessage and save it to session as flashdata
                }

                var payload = {
                    id: user.id,
                }
                console.log(">>PAYLOAD: ", payload);
                var token = jwt.sign(payload, jwtOptions.secretOrKey);

                console.log(">> New Token ==> ", token);

                user["token"] = token;

                console.log(">>USER Obj to send to Client ==> ", user);

                // all is well, return successful user
                return done(null, user);
            });

        })); */
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) { // callback with email and password from our form
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({
                    'username': req.body.email
                })
                .populate("contacts", {
                    "username": 1,
                    "email": 1
                })
                .populate("conversations", {
                    "participants": 1,
                    "conversationType": 1,
                    "conversationName": 1
                })                
                .exec((err, user) => {
                    //console.log("User=", user)

                    //console.log("Inside LOCAL-LOGIN || user.password=", user.password);
                    // if there are any errors, return the error before anything else
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, {
                            message: 'Incorrect username.'
                        }); // req.flash is the way to set flashdata using connect-flash

                    // if the user is found but the password is wrong
                    if (!user.validPassword(req.body.password)) {
                        //console.error("Wrong Password");
                        return done(null, false, {
                            message: 'Incorrect password.'
                        }); // create the loginMessage and save it to session as flashdata
                    }

                    var payload = {
                        id: user.id,
                    }

                    //console.log(">>PAYLOAD: ", payload);
                    var token = jwt.sign(payload, jwtOptions.secretOrKey);

                    user["token"] = token;

                    // all is well, return successful user */
                    return done(null, user);

                });

        }));

};