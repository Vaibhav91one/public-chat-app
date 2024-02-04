const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
    userId: String,
    ChatRoomId: String,
    username: String,
    text: String,
    file: String,
}, {timestamps: true})

const MessageModel = mongoose.model("Message", MessageSchema)

module.exports = MessageModel