var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Conversations = require('../models/ConversationSchema');
var Users = require('../models/UserSchema');
var Messages = require('../models/MessageSchema');
var fs = require('fs');
var sys = require('sys');

router.post("/createConversation", (req, res, next) => {
    console.log(">>>> Inside create Conversation | req.body=", req.body);
    var newConversation = new Conversations();
    newConversation.conversationType = req.body.conversationType;
    newConversation.conversationName = req.body.conversationName;
    newConversation.participants = req.body.participants;
    newConversation.owner = req.body.owner;
    newConversation.createdAt = Date.now();

    newConversation.save(function (err) {
        if (err) throw err;
        console.log("The new conversation's data=", newConversation);
        Users.update({
            "_id": {
                $in: newConversation.participants
            }
        }, {
            $addToSet: {
                "conversations": newConversation._id
            }
        }, {
            multi: true
        }).exec((err, done) => {
            if (err) return err;
            console.log("After Updating USERS' conversations", done);
        });
        Conversations.findOne({
                _id: newConversation._id
            })
            .populate("participants", {
                "email": 1,
                "fullName": 1,
                "username": 1
            })
            .exec((err, nConv) => {
                if (err) return err;
                console.log("After the populate // nConv=", nConv);
                return res.status(200).json(nConv);
            });
    });
});

router.post("/updateGroupParticipants", (req, res, next) => {
    console.log(">>>> Inside updateGroupParticipants | req.body=", req.body);
    Users.update({
        "_id": {
            $in: req.body.newContacts
        }
    }, {
        $addToSet: {
            "conversations": req.body.conversationId
        }
    }, {
        multi: true
    }).exec((err, done) => {
        if (err) return err;
        console.log("After Updating USERS' conversations", done);
        Conversations.update({
            _id: req.body.conversationId
        }, {
            $push: {
                "participants": {
                    $each: req.body.newContacts
                }
            }
        }).exec((err, finished) => {
            if (err) return err;
            console.log("After Updating Conversations conversations", finished);
            return res.status(200).json(finished);
        });
    });
});

router.post("/findConversation", (req, res, next) => {
    Conversations.find({
            "participants": {
                $all: [req.body.myId, req.body.contactId]
            }
        })
        .populate("participants", {
            "email": 1,
            "fullName": 1,
            "username": 1
        })
        .exec((err, fConv) => {
            if (err) return err;
            console.log("After the populate // fConv=", fConv);
            return res.status(200).json(fConv);
        });
});

router.post("/sendMessage", (req, res, next) => {
    console.log("Inside sendMessage | body=", req.body);
    var newMessage = new Messages();
    newMessage.msgContent = req.body.msgContent;
    newMessage.userId = req.body.userId;
    newMessage.msgType = req.body.msgType;
    newMessage.conversationId = req.body.conversationId;
    newMessage.createdAt = req.body.createdAt;

    newMessage.save(function (err) {
        if (err) throw err;
        console.log("The new message's data=", newMessage);
        return res.status(200).json(newMessage);
    });

});

router.get("/fetchConversation", (req, res, next) => {
    console.log("=== Inside FetchConversation", req.headers.conversation)
    Conversations.findOne({
            "_id": req.headers.conversation
        })
        .populate("participants", {
            "email": 1,
            "fullName": 1,
            "username": 1
        })
        .exec((err, conv) => {
            if (err) return err;
            //console.log('conv: ',conv._doc._id);
            Messages.aggregate({
                $match: {
                    conversationId: conv._doc._id
                }
            }).exec(
                (err, msgs) => {
                    if (err) return err;
                    var r = Object.assign({}, conv._doc, {
                        messages: msgs
                    });
                    return res.json(r);
                }
            )
        });
})

module.exports = router;