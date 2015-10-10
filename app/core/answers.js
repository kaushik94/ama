'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    helpers = require('./helpers');

function AnswerManager(options) {
    this.core = options.core;
}

AnswerManager.prototype.create = function(options, cb) {
    var Answer = mongoose.model('Answer'),
        Message = mongoose.model('Message'),
        Room = mongoose.model('Room'),
        User = mongoose.model('User');

    if (typeof cb !== 'function') {
        cb = function() {};
    }

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }
        if (!room) {
            return cb('Room does not exist.');
        }
        if (room.archived) {
            return cb('Room is archived.');
        }
        if (!room.isAuthorized(options.owner)) {
            return cb('Not authorized.');
        }

        Message.findById(options.message, function (err, message) {
            if(err) {
                console.error(err);
                return cb(err);
            }
            if(!message) {
                return cb('Message does not exist.');
            }
            if (!message.isAuthorized(options.owner, room.owner)) {
                return cb('Not authorized.');
            }

            Answer.findOne( {message: options.message}, function (err, answer) {
                if(err) {
                    console.error(err);
                    return cb(err);
                }
                if(!answer && !message.answered) {
                    Answer.create(options, function(err, answer) {
                        if (err) {
                            console.error(err);
                            return cb(err);
                        }
                        // Touch Room's lastActive
                        room.lastActive = answer.posted;
                        message.answered = true;
                        message.save();
                        room.save();
                        // Temporary workaround for _id until populate can do aliasing
                        User.findOne(options.owner, function(err, user) {
                            if (err) {
                                console.error(err);
                                return cb(err);
                            }

                            cb(null, answer, message, room, user);
                            this.core.emit('answers:new', answer, message, room, user, options.data);
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

AnswerManager.prototype.list = function(options, cb) {
    var Room = mongoose.model('Room');
    var Message = mongoose.model('Message');

    options = options || {};

    if (!options.room) {
        return cb(null, []);
    }

    options = helpers.sanitizeQuery(options, {
        defaults: {
            reverse: true,
            take: 500
        },
        maxTake: 5000
    });

    var Answer = mongoose.model('Answer');

    var find = Answer.find({
        room: options.room
    });

    if (options.since_id) {
        find.where('_id').gt(options.since_id);
    }

    if (options.from) {
        find.where('posted').gt(options.from);
    }

    if (options.to) {
        find.where('posted').lte(options.to);
    }

    if (options.query) {
        find = find.find({$text: {$search: options.query}});
    }

    if (options.expand) {
        var includes = options.expand.replace(/\s/, '').split(',');

        if (_.includes(includes, 'room')) {
            find.populate('room', 'id name');
        }

        if (_.includes(includes, 'message')) {
            find.populate('message', 'id text posted owner');
        }
    }

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.reverse) {
        find.sort({ 'posted': -1 });
    } else {
        find.sort({ 'posted': 1 });
    }

    Room.findById(options.room, function(err, room) {
        if (err) {
            console.error(err);
            return cb(err);
        }

        var opts = {
            userId: options.userId,
            password: options.password
        };

        room.canJoin(opts, function(err, canJoin) {
            if (err) {
                console.error(err);
                return cb(err);
            }

            if (!canJoin) {
                return cb(null, []);
            }

            find.limit(options.take)
                .exec(function(err, answers) {
                    if (err) {
                        console.error(err);
                        return cb(err);
                    }
                    cb(null, answers);
                });
        });
    });
};

module.exports = AnswerManager;
