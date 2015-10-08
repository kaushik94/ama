//
// Answers Controller
//

'use strict';

module.exports = function() {

    var app = this.app,
        core = this.core,
        middlewares = this.middlewares;

    core.on('answers:new', function(answer, message, room, user) {
        var ans = answer.toJSON();
        ans.message = message.toJSON(user);
        ans.room = room.toJSON(user);

        app.io.to(room.id)
            .emit('answers:new', ans);
    });

    //
    // Routes
    //
    app.route('/rooms/:room/answers')
        .all(middlewares.requireLogin)
        .get(function(req) {
            req.io.route('answers:list');
        })
        .post(function(req) {
            req.io.route('answers:create');
        });

    //
    // Sockets
    //
    app.io.route('answers', {
        create: function(req, res) {
            var options = {
                owner: req.user._id,
                room: req.param('room'),
                message: req.param('message'),
                text: req.param('text')
            };

            core.answers.create(options, function(err, answer) {
                if (err) {
                    return res.sendStatus(400);
                }
                res.status(201).json(answer);
            });
        },
        list: function(req, res) {
            var options = {
                userId: req.user._id,
                password: req.param('password'),

                room: req.param('room'),
                since_id: req.param('since_id'),
                from: req.param('from'),
                to: req.param('to'),
                query: req.param('query'),
                reverse: req.param('reverse'),
                skip: req.param('skip'),
                take: req.param('take'),
                expand: req.param('expand')
            };

            core.answers.list(options, function(err, answers) {
                if (err) {
                    return res.sendStatus(400);
                }

                answers = answers.map(function(answer) {
                    return answer.toJSON(req.user);
                });

                res.json(answers);
            });
        }
    });

};
