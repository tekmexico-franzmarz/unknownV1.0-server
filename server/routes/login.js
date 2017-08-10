var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/UserSchema');
var passport = require('passport');

router.post('/', passport.authenticate('local-login'),function(req,res){
    console.log("Response from server",req.user.token);
    res.json(req.user.token);
});

module.exports = router;