var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/UserSchema');
var passport = require('passport');

router.post('/', passport.authenticate('local-signup', {
    successRedirect: '/#/login',
    failureRedirect: '/#/signup'
}));

router.get('/', function (req, res, next) {
    res.send('REPTILEHAUS Chat Server')
});

module.exports = router;