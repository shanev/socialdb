class SocialGraph {
  constructor(redis = null) {
    this.redis = redis;
  }

  follow(fromId, toId) {
    this.redis.multi()
      .sadd(`user:${fromId}:requested`, toId)
      .sadd(`user:${toId}:pending`, fromId)
      .exec();

    return new Promise((resolve) => { resolve(true); });
  }

  // followers(userId, callback) {
  //   // this.redis.smembers(`user:${userId}:followers`, (err, res) => (callback(res)));
  //   return callback([1, 2, 3]);
  // }
}

module.exports = SocialGraph;
