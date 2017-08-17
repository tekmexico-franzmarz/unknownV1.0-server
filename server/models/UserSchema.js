var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var Conversations=require("./ConversationSchema");

var UserSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    locale: String,
    facebookId: String,
    contacts: [String],
    conversations: [{ type: Schema.Types.ObjectId, ref:"Conversations"}],
    notifications: [{typeNotif:String,from:String,senderId: Schema.Types.ObjectId,content:String,date:Number}],
    groups: Array,
    token: String,
    createdAt: Number,
    updatedAt: Number
});

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Users', UserSchema);