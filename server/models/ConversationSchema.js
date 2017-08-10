var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConversationSchema = new Schema({
    conversationType:String,
    conversationName:String,
    participants:[{ type:Schema.Types.ObjectId, ref:"Users"}],
    createdAt:Number,
    owner: Schema.Types.ObjectId
});

module.exports = mongoose.model('Conversations', ConversationSchema);