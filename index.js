/*
  Social graph for user friends and relationships.
  API:
    Actions:
    * follow(fromId, toId)
    * unfollow(fromId, toId)

    Data:
    * pending(userId)
    * requested(userId)
    * accepted(userId)
    * friends(userId) (alias of accepted)
 */
class SocialGraph {
  constructor(redis = null, options = {}) {
    this.redis = redis;
    this.namespace = options.namespace || 'user';
  }

  /**
   * Creates a relationship between fromId and toId
   * i.e:
   *   user 1 wants to follow user 11:
   *     follow(1, 11)
   *     user:1:requested 11
   *     user:11:pending 1
   *   user 11 follows user 1 back:
   *     follow(11, 1)
   *     user:1:requested n/a
   *     user:11:pending n/a
   *     user:1:accepted 11
   *     user:11:accepted 1
   */
  follow(fromId, toId, callback) {
    // check if this is an initial or reciprocal request
    this.redis.sismember(`${this.namespace}:${fromId}:pending`, toId, (err, res) => {
      if (res === 0) {
        // we have an initial request
        this.redis.multi()
          .sadd(`${this.namespace}:${fromId}:requested`, toId)
          .sadd(`${this.namespace}:${toId}:pending`, fromId)
          .exec();
        return callback(true);
      }
      // we have a reciprocal request
      this.redis.multi()
        .srem(`${this.namespace}:${fromId}:pending`, toId)
        .srem(`${this.namespace}:${toId}:requested`, fromId)
        .sadd(`${this.namespace}:${toId}:accepted`, fromId)
        .sadd(`${this.namespace}:${fromId}:accepted`, toId)
        .exec();
      return callback(true);
    });
  }

  requested(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:requested`, (err, res) => (callback(res)));
  }

  pending(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:pending`, (err, res) => (callback(res)));
  }

  accepted(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:accepted`, (err, res) => (callback(res)));
  }

}

module.exports = SocialGraph;
