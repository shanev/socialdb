const debug = require('debug')('redis-social-graph');

const redis = require('redis');

const client = redis.createClient();

module.exports = function follow(fromId, toId) {
  client.sadd(`user:${fromId}:pending`, toId);
};
