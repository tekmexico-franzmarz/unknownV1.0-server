var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/UserSchema');
var passport = require('passport');
var cookieParser = require('cookie-parser')

router.get('/', passport.authenticate('twitter'), function (req, res) {});

router.get('/callback', passport.authenticate('twitter', {
        failureRedirect: 'http://localhost:3000/#/register'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        console.log(">>>>>Inside Twitter Callback || res", res.req.user);
        console.log(">>>>>Inside Twitter Callback || user.token", res.req.user.twitter.token);
        let options = {
            maxAge: 1000 * 60 * 15, // would expire after 15 minutes
            httpOnly: false, // The cookie only accessible by the web server
            signed: false // Indicates if the cookie should be signed
        }
        res.cookie(`twToken=${res.req.user.twitter.token}`);
        res.redirect(`http://localhost:3000/#/dashboard?code=${res.req.user.twitter.id}&origin=tw`);
    });

module.exports = router;