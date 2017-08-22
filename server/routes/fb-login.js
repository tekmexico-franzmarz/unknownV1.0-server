var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/UserSchema');
var passport = require('passport');
var cookieParser = require('cookie-parser')

router.get('/', passport.authenticate('facebook'), function (req, res) {});

router.get('/callback', passport.authenticate('facebook', {
        failureRedirect: 'http://localhost:3000/#/register'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        console.log(">>>>>Inside Facebook Callback || res", res.req.user);
        console.log(">>>>>Inside Facebook Callback || user.token", res.req.user.facebook.token);
        let options = {
            maxAge: 1000 * 60 * 15, // would expire after 15 minutes
            httpOnly: false, // The cookie only accessible by the web server
            signed: false // Indicates if the cookie should be signed
        }
        res.cookie(`fbToken=${res.req.user.facebook.token}`);
        res.redirect(`http://localhost:3000/#/dashboard?code=${res.req.user.facebook.token}&origin=fb`);
    });

router.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.json({
            user: req.user
        });
    });
module.exports = router;