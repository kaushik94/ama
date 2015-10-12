var mongoose = require('mongoose'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter');

function Twitter(options, core) {
    this.options = options;
    this.core = core;
    this.key = 'twitter';

    this.setup = this.setup.bind(this);
    this.getTwitterStrategy = this.getTwitterStrategy.bind(this);
}

Twitter.defaults = {
    isSSO: true
};

Twitter.key = 'twitter';

Twitter.prototype.setup = function() {
    passport.use(this.getTwitterStrategy());
};

Twitter.prototype.authenticate = function(req, res, cb) {
    if (!res) {
        return cb(null, null);
    }

    passport.authenticate('twitter', cb)(req, res);
};

Twitter.prototype.getTwitterStrategy = function() {
    return new TwitterStrategy({
            consumerKey: this.options.consumerKey,
            consumerSecret: this.options.consumerSecret,
            callbackURL: this.options.callbackURL
        },
        function (token, tokenSecret, profile, done) {
            return Twitter.findOrCreate(this.core, profile, done);
        }.bind(this)
    );
};

Twitter.findOrCreate = function(core, twitterUser, callback) {
    var User = mongoose.model('User');

    // TODO Construct unique uid instead of username to
    //      provent collisions between multiple auth providers
    //      Ex. uid = base64(md5(twitterURL + twitterUser.id))
    //          base64 because current uid is limited to length <= 24
    User.findOne({ uid: twitterUser.id }, function (err, user) {
        if (err) {
            return callback(err);
        }
        if (!user) {
            Twitter.createUser(core, twitterUser, callback);
        } else {
            return callback(null, user);
        }
    });
};

Twitter.createUser = function(core, twitterUser, callback) {
    var User = mongoose.model('User');

    var splitName = twitterUser._json.name.split(' ');

    var data = {
        uid: twitterUser.id,
        username: twitterUser.username,
        email: twitterUser.id+'@twitter.com',
        firstName: splitName.length === 1 ? splitName[0] : splitName.slice(0, splitName.length-1).join(' '),
        lastName: splitName.length !== 1 ? splitName.slice(splitName.length-1):'',
        displayName: twitterUser.displayName
    };

    if(twitterUser && twitterUser.photos && twitterUser.photos.length) {
        data.image = twitterUser.photos[0].value;
    }

    core.account.create('twitter',
        data,
        function (err, user) {
            if (err) {
                console.error(err);
                return callback(err);
            }
            return callback(null, user);
        });
};


module.exports = Twitter;
