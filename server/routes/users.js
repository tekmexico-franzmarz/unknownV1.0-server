var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");

var User = require("../models/UserSchema");

var passport = require("passport");
var jwt = require("jsonwebtoken");
var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = "chatserver";

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);
  // usually this would be a database call:
  var user = {
    id: jwt_payload.id
  };
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);

/* router.post('/myProfile', function(req,res,next){ 
    var token=jwtFromRequest(req);   
    console.log("Inside myProfile",token);     
}); */

router.get(
  "/myProfile",
  passport.authenticate("jwt", {
    session: false
  }),
  function (req, res, next) {
    console.log("Inside myProfile=>req", req.user);
    User.findOne({
        _id: req.user.id
      })
      .populate("contacts", {
        username: 1,
        email: 1
      })
      .populate("conversations", {
        participants: 1,
        conversationType: 1,
        conversationName: 1
      })
      .exec((err, user) => {
        if (err) return err;

        var options = {
          path: "conversations.participants",
          select: {
            email: 1,
            fullName: 1,
            username: 1
          },
          model: "Users"
        };
        User.populate(user, options, (err, finalUser) => {
          res.json(finalUser);
        });
      });
  }
);

router.post("/requestContact", (req, res, next) => {
  User.update({
      email: req.body.email
    }, {
      $addToSet: {
        notifications: {
          typeNotif: req.body.typeNotif,
          from: req.body.from,
          senderId: req.body.senderId,
          content: req.body.content,
          date: req.body.date
        }
      }
    },
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(404).json(data);
      } else {
        if (!data.nModified) return res.status(404).json(data);
        //console.log("success!",data);
        return res.status(200).json(data);
      }
    }
  );
});

router.post("/denyContactRequest", (req, res, next) => {
  User.update({
      _id: req.body.myId
    }, {
      $pull: {
        notifications: {
          _id: req.body._id
        }
      }
    },
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(404).json(data);
      } else {
        if (!data.nModified) return res.status(404).json(data);
        return res.status(200).json(data);
      }
    }
  );
});

router.post("/acceptContactRequest", (req, res, next) => {
  User.update({
      _id: req.body.myId
    }, {
      $pull: {
        notifications: {
          _id: req.body._id
        }
      },
      $addToSet: {
        contacts: req.body.senderId //update my contacts with the sender ID
      }
    },
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(404).json(data);
      } else {
        if (!data.nModified) return res.status(404).json(data);
        console.log(
          "Accepted user request, updating sender's contacts | data=",
          data
        );
        User.update({
            _id: req.body.senderId
          }, {
            $addToSet: {
              contacts: req.body.myId //update my contacts with the sender ID
            }
          },
          (err, data) => {
            if (err) {
              console.log(err);
              return res.status(404).json(data);
            } else {
              if (!data.nModified) return res.status(404).json(data);
              return res.status(200).json(data);
            }
          }
        );
      }
    }
  );
});

router.post("/acceptNotification", (req, res, next) => {
  User.update({
      _id: req.body.myId
    }, {
      $pull: {
        notifications: {
          _id: req.body._id
        }
      }
    },
    (err, data) => {
      if (err) {
        console.log(err);
        return res.status(404).json(data);
      } else {
        if (!data.nModified) return res.status(404).json(data);
        console.log("Accepted Notification | data=", data);
        return res.status(200).json(data);
      }
    }
  );
});

router.post("/updateMyProfile", (req, res, next) => {
  User.findOne({
    _id: req.body.myId
  }, (err, user) => {
    console.log(">>>> Inside UPDATE MY PROFILE <<<<< req.body=", req.body)
    if (err) return err;
    if (req.body.languageSetting) user.locale = req.body.languageSetting;
    if (req.body.username) user.username = req.body.usernameSetting;
    user.save((err, data) => {
      if (err) return res.status(404).json(data);
      console.log("Updated Profile | data=", data);
      return res.status(200).json(data);
    });
  });
});

router.post("/getMyProfile", (req, res, next) => {
  if (req.body.origin === 'fb') {
    User.findOne({
      'facebook.token': req.body.token
    }, (err, user) => {
      if (err) return err;
      return res.status(200).json(user);
    });
  }
  switch (req.body.origin) {
    case 'fb':
      User.findOne({
        'facebook.token': req.body.token
      }, (err, user) => {
        if (err) return err;
        return res.status(200).json(user);
      });
      break;
      case 'tw':
      User.findOne({
        'twitter.id': req.body.token
      }, (err, user) => {
        if (err) return err;
        return res.status(200).json(user);
      });
      break;
  }
});

module.exports = router;