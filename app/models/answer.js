//
// Answer
//

'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var AnswerSchema = new mongoose.Schema({
    message: {
        type: ObjectId,
        ref: 'Message',
        required: true
    },
    room: {
        type: ObjectId,
        ref: 'Room',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    posted: {
        type: Date,
        default: Date.now,
        index: true
    }
});

AnswerSchema.index({ text: 'text', message: 1, room: 1, posted: -1, _id: 1 });

// EXPOSE ONLY CERTAIN FIELDS
// This helps ensure that the client gets
// data that can be digested properly
AnswerSchema.method('toJSON', function(user) {
    var data = {
        id: this._id,
        text: this.text,
        posted: this.posted,
    };

    if(this.message){
        if (this.message._id) {
            data.message = this.message.toJSON(user);
        } else {
            data.message = this.message;
        }
    }

    if(this.room){
        if (this.room._id) {
            data.room = this.room.toJSON(user);
        } else {
            data.room = this.room;
        }
    }
    
    return data;
});

module.exports = mongoose.model('Answer', AnswerSchema);
