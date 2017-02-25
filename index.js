const debug = require('debug')('redis-social-graph');

const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  debug.err(err);
});

module.exports = function follow(fromId, toId) {
  client.multi()
    .sadd(`user:${fromId}:requested`, toId)
    .sadd(`user:${toId}:pending`, fromId)
    .exec();

  return new Promise((resolve) => { resolve(true); });
};
