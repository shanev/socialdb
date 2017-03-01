/*
  String constants for Redis keys identifying user's follower states.
 */
const STATE_KEY = {
  pending: 'pending',
  requested: 'requested',
  accepted: 'accepted',
};

/*
  Main class for user social graph with friend list and follower status.
  Users must follow each other to be friends and in the `accepted` state.
 */
class SocialDB {
  constructor(redis = null, options = {}) {
    if (redis == null) {
      throw new Error('Initialized without a Redis client.');
    }
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
    this.redis.sismember(`${this.namespace}:${fromId}:${STATE_KEY.pending}`, toId, (err, res) => {
      if (res === 0) {
        // we have an initial request
        this.redis.multi()
          .zadd(`${this.namespace}:${fromId}:${STATE_KEY.requested}`, Date.now(), toId)
          .zadd(`${this.namespace}:${toId}:${STATE_KEY.pending}`, Date.now(), fromId)
          .exec();
        return callback(true);
      }
      // we have a reciprocal request
      this.redis.multi()
        .zrem(`${this.namespace}:${fromId}:${STATE_KEY.pending}`, toId)
        .zrem(`${this.namespace}:${toId}:${STATE_KEY.requested}`, fromId)
        .zadd(`${this.namespace}:${toId}:${STATE_KEY.accepted}`, Date.now(), fromId)
        .zadd(`${this.namespace}:${fromId}:${STATE_KEY.accepted}`, Date.now(), toId)
        .exec();
      return callback(true);
    });
  }

  /*
    Mutually removes frendship between two users by removing each
    other from their `accepted` lists.
   */
  unfollow(fromId, toId, callback) {
    this.redis.multi()
      .zrem(`${this.namespace}:${fromId}:${STATE_KEY.accepted}`, toId)
      .zrem(`${this.namespace}:${toId}:${STATE_KEY.accepted}`, fromId)
      .exec();
    return callback(true);
  }

  /*
    Returns a callback with a list of requested friends for a given `userId`
   */
  requested(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:${STATE_KEY.requested}`, (err, res) => (callback(res)));
  }

  /*
    Returns a callback with a list of pending friends for a given `userId`
   */
  pending(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:${STATE_KEY.pending}`, (err, res) => (callback(res)));
  }

  /*
    Returns a callback with a list of accepted friends for a given `userId`
   */
  accepted(userId, callback) {
    this.redis.smembers(`${this.namespace}:${userId}:${STATE_KEY.accepted}`, (err, res) => (callback(res)));
  }
}

module.exports = SocialDB;
