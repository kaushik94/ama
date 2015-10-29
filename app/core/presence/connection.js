'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('node-uuid');


function Connection(type, user) {
    if(user){
      EventEmitter.call(this);
      this.type = type;
      this.id = uuid.v4();
      this.user = user;
    }
}

util.inherits(Connection, EventEmitter);

Connection.prototype.toJSON = function() {
  if(this)
    return {
        id: this.id,
        type: this.type,
        user: this.user
    };
  return;
};

module.exports = Connection;
