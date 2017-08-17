var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/UserSchema');
var passport = require('passport');

router.post('/', passport.authenticate('facebook'), function (req, res) {
    console.log("Response from server", req.user.token);
    res.json(req.user.token);
});

router.post('/callback', passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

router.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.json({
            user: req.user
        });
    });
module.exports = router;