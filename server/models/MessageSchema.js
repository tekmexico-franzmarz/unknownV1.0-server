var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },    
    conversationId:Schema.Types.ObjectId,
    msgContent:String,
    msgType:String, 
    createdAt:Number
});

module.exports = mongoose.model('Messages', MessageSchema);