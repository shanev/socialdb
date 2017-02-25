const debug = require('debug')('redis-social-graph');

const redis = require('redis');

const client = redis.createClient();

module.exports = function follow(fromId, toId, callback) {
  client.sadd(`user:${fromId}:requested`, toId);
  client.sadd(`user:${toId}:pending`, fromId);
  return callback(true);
};
