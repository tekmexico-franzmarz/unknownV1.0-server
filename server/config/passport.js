var jwt = require('jsonwebtoken');
var passportJWT = require("passport-jwt");
var loginOptions = require("../config/auth");
var mongoose = require('mongoose');
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.secretOrKey = 'chatserver';

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var TwitterStrategy = require("passport-twitter").Strategy;
var InstagramStrategy = require("passport-instagram").Strategy;

var User = require('../models/UserSchema');

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


    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) {
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
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, {
                            message: 'Incorrect username.'
                        });

                    if (!user.validPassword(req.body.password)) {
                        return done(null, false, {
                            message: 'Incorrect password.'
                        });
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

    // Configure the Facebook strategy for use by Passport.
    //
    // OAuth 2.0-based strategies require a `verify` function which receives the
    // credential (`accessToken`) for accessing the Facebook API on the user's
    // behalf, along with the user's profile.  The function must invoke `cb`
    // with a user object, which will be set at `req.user` in route handlers after
    // authentication.
    passport.use('facebook', new FacebookStrategy({
            clientID: loginOptions.FB_CLIENT_ID,
            clientSecret: loginOptions.FB_CLIENT_SECRET,
            /* callbackURL: 'http://localhost:4200/#/home', */
            callbackURL: 'http://localhost:3000/api/fb-login/callback',
            profileFields: ['id', 'displayName', 'photos', 'email']
        },
        function (accessToken, refreshToken, profile, cb) {
            // In this example, the user's Facebook profile is supplied as the user
            // record.  In a production-quality application, the Facebook profile should
            // be associated with a user record in the application's database, which
            // allows for account linking and authentication with other identity
            // providers.

            /* console.log(">>>>>Inside Facebook strategy || accessToken=", accessToken); 
            console.log(">>>>>Inside Facebook strategy || profile=", profile); */

            if (profile.emails) {
                User.findOne({
                    $or: [{
                            'facebook.id': profile.id
                        },
                        {
                            'email': profile.emails[0].value
                        }
                    ]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Facebook Strategy | User had already registered. Updating accessToken...");

                        User.update({
                                email: user.email
                            }, {
                                'accessToken': accessToken
                            },
                            (err, data) => {
                                if (err) {
                                    console.log(err);
                                    return data;
                                } else {
                                    return cb(err, user);
                                }
                            }
                        );
                    } else {
                        console.log("Inside Facebook Strategy | Register through Facebook. Adding user to DB...");

                        var newUser = new User();

                        newUser.facebook.profileImage = `https://graph.facebook.com/${profile._json.id}/picture?width=480&height=480&access_token=${accessToken}`;
                        newUser.facebook.profileImageThumb = `https://graph.facebook.com/${profile._json.id}/picture?width=80&height=80&access_token=${accessToken}`;
                        newUser.facebook.id = profile._json.id;
                        newUser.facebook.token = accessToken;
                        newUser.facebook.email = profile._json.email;
                        newUser.facebook.name = profile._json.name;

                        newUser.username = newUser.facebook.name;
                        newUser.fullName = newUser.facebook.name;
                        newUser.profileImage = newUser.facebook.profileImage;
                        newUser.profileImageThumb = newUser.facebook.profileImageThumb;
                        newUser.email = newUser.facebook.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            } else {
                User.findOne({
                    $or: [{
                        'facebook.id': profile.id
                    }]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Facebook Strategy | User had already registered. Updating accessToken...");

                        User.update({
                                email: user.email
                            }, {
                                'accessToken': accessToken
                            },
                            (err, data) => {
                                if (err) {
                                    console.log(err);
                                    return data;
                                } else {
                                    return cb(err, user);
                                }
                            }
                        );
                    } else {
                        console.log("Inside Facebook Strategy | Register through Facebook. Adding user to DB...");

                        var newUser = new User();

                        newUser.facebook.profileImage = `https://graph.facebook.com/${profile._json.id}/picture?width=480&height=480&access_token=${accessToken}`;
                        newUser.facebook.profileImageThumb = `https://graph.facebook.com/${profile._json.id}/picture?width=80&height=80&access_token=${accessToken}`;
                        newUser.facebook.id = profile._json.id;
                        newUser.facebook.token = accessToken;
                        newUser.facebook.email = "Private Email";
                        newUser.facebook.name = profile._json.name;

                        newUser.username = newUser.facebook.name;
                        newUser.fullName = newUser.facebook.name;
                        newUser.profileImage = newUser.facebook.profileImage;
                        newUser.profileImageThumb = newUser.facebook.profileImageThumb;
                        newUser.email = newUser.facebook.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            }
        }));

    passport.use('twitter', new TwitterStrategy({
            consumerKey: loginOptions.TW_CLIENT_ID,
            consumerSecret: loginOptions.TW_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/api/tw-login/callback',
        },
        function (token, tokenSecret, profile, cb) {
            console.log(">>>>>>>>>> Inside TWITTER strategy || profile=", profile._json);
            if (profile._json.email) {
                User.findOne({
                    $or: [{
                            'twitter.id': profile._json.id
                        },
                        {
                            'email': profile._json.email
                        }
                    ]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Twitter Strategy | User had already registered. Updating accessToken...", user);

                        return cb(err, user);
                    } else {
                        console.log("Inside Twitter Strategy | Register through Twitter. Adding user to DB...");

                        var newUser = new User();

                        newUser.twitter.profileImage = profile._json.profile_image_url;
                        newUser.twitter.profileImageThumb = profile._json.profile_image_url;
                        newUser.twitter.id = profile._json.id;
                        newUser.twitter.email = "Private email";
                        newUser.twitter.name = profile._json.name;

                        newUser.username = profile._json.screen_name;
                        newUser.fullName = newUser.twitter.name;
                        newUser.profileImage = newUser.twitter.profileImage;
                        newUser.profileImageThumb = newUser.twitter.profileImageThumb;
                        newUser.email = newUser.twitter.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            } else {
                User.findOne({
                    $or: [{
                        'twitter.id': profile._json.id
                    }]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Facebook Strategy | User had already registered. Updating accessToken...");
                        return cb(err, user);
                        
                    } else {
                        console.log("Inside Facebook Strategy | Register through Facebook. Adding user to DB...");

                        var newUser = new User();

                        newUser.twitter.profileImage = profile._json.profile_image_url;
                        newUser.twitter.profileImageThumb = profile._json.profile_image_url;
                        newUser.twitter.id = profile._json.id;
                        newUser.twitter.email = "Private email";
                        newUser.twitter.name = profile._json.name;

                        newUser.username = profile._json.screen_name;
                        newUser.fullName = newUser.twitter.name;
                        newUser.profileImage = newUser.twitter.profileImage;
                        newUser.profileImageThumb = newUser.twitter.profileImageThumb;
                        newUser.email = newUser.twitter.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            }
        }
    ));

    passport.use('instagram', new InstagramStrategy({
            consumerKey: loginOptions.INST_CLIENT_ID,
            consumerSecret: loginOptions.INST_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/api/inst-login/callback',
        },
        function (token, tokenSecret, profile, cb) {
            console.log(">>>>>>>>>> Inside INSTAGRAM strategy || profile=", profile._json);
            if (profile._json.email) {
                User.findOne({
                    $or: [{
                            'instagram.id': profile._json.id
                        },
                        {
                            'email': profile._json.email
                        }
                    ]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Twitter Strategy | User had already registered. Updating accessToken...", user);

                        return cb(err, user);
                    } else {
                        console.log("Inside Twitter Strategy | Register through Twitter. Adding user to DB...");

                        var newUser = new User();

                        newUser.twitter.profileImage = profile._json.profile_image_url;
                        newUser.twitter.profileImageThumb = profile._json.profile_image_url;
                        newUser.twitter.id = profile._json.id;
                        newUser.twitter.email = "Private email";
                        newUser.twitter.name = profile._json.name;

                        newUser.username = profile._json.screen_name;
                        newUser.fullName = newUser.twitter.name;
                        newUser.profileImage = newUser.twitter.profileImage;
                        newUser.profileImageThumb = newUser.twitter.profileImageThumb;
                        newUser.email = newUser.twitter.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            } else {
                User.findOne({
                    $or: [{
                        'twitter.id': profile._json.id
                    }]
                }, function (err, user) {

                    if (err) return done(err);

                    if (user) {
                        console.log("Inside Facebook Strategy | User had already registered. Updating accessToken...");
                        return cb(err, user);
                        
                    } else {
                        console.log("Inside Facebook Strategy | Register through Facebook. Adding user to DB...");

                        var newUser = new User();

                        newUser.twitter.profileImage = profile._json.profile_image_url;
                        newUser.twitter.profileImageThumb = profile._json.profile_image_url;
                        newUser.twitter.id = profile._json.id;
                        newUser.twitter.email = "Private email";
                        newUser.twitter.name = profile._json.name;

                        newUser.username = profile._json.screen_name;
                        newUser.fullName = newUser.twitter.name;
                        newUser.profileImage = newUser.twitter.profileImage;
                        newUser.profileImageThumb = newUser.twitter.profileImageThumb;
                        newUser.email = newUser.twitter.email;

                        newUser.confirmation_code = Math.random().toString(36).slice(2);

                        newUser.save(function (err) {
                            if (err) throw err;
                            return cb(err, newUser);
                        });
                    }
                });
            }
        }
    ));
};