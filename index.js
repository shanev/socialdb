const debug = require('debug')('redis-social-graph');

const redis = require('redis');

const client = redis.createClient();

// return this.redis.multi()
//   .zadd(`${this.namespace}:${this.followingKey}:${scope}:${fromId}`, getEpoch(), toId)
//   .zadd(`${this.namespace}:${this.followersKey}:${scope}:${toId}`, getEpoch(), fromId)
//   .exec((err, replies) =>

module.exports = function follow(fromId, toId) {
  client.multi()
    .sadd(`user:${fromId}:requested`, toId)
    .sadd(`user:${toId}:pending`, fromId)
    .exec((err) => {
      if (err) { debug.err(err); }
    });

  return new Promise((resolve) => { resolve(true); });
};
