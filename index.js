// Start node with DEBUG=socialdb to see debug output
const debug = require('debug')('socialdb');

const redis = require('redis');

/**
 * String constants for Redis keys identifying user's follower states.
 */
const STATE_KEY = {
  pending: 'pending',
  requested: 'requested',
  accepted: 'accepted',
};

/**
 * Main class for user social graph with friend list and follower status.
 * Users must follow each other to be friends and in the `accepted` state.
 */
class SocialDB {
  /**
   * Initializes a new SocialDB object.
   * Optionally takes in a Redis config (https://github.com/NodeRedis/node_redis#rediscreateclient).
   */
  constructor(config = null, namespace = 'user') {
    this.client = (config != null) ? redis.createClient(config) : redis.createClient();
    this.namespace = namespace;
  }

  /**
   * follow() creates a relationship between `fromId` and `toId` and returns an empty Promise.
   * For an initial request, `toId` is added to `fromId`s `requested` list, and `fromId` is added
   * to `toId`s `pending` list. For a reciprocal request, `toId` is removed from `fromId`s
   * `pending` list, and `fromId` is removed from `toId`s `requested` list. Then both user ids are
   * added to each other's `accepted` lists, representing mutual friendship between both users.
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
  follow(fromId, toId) {
    return new Promise((resolve) => {
      // check if this is an initial or reciprocal request
      this.client.zscore(`${this.namespace}:${fromId}:${STATE_KEY.pending}`, toId, (err, result) => {
        // use date for sorted set ordering
        const score = Date.now();

        if (result === null) {
          // handle initial request
          this.client.multi()
            .zadd(`${this.namespace}:${fromId}:${STATE_KEY.requested}`, score, toId)
            .zadd(`${this.namespace}:${toId}:${STATE_KEY.pending}`, score, fromId)
            .exec(() => {
              debug(`${fromId} requested to be friends with ${toId}`);
              return resolve();
            });
        } else {
          // handle reciprocal request
          this.client.multi()
            .zrem(`${this.namespace}:${fromId}:${STATE_KEY.pending}`, toId)
            .zrem(`${this.namespace}:${toId}:${STATE_KEY.requested}`, fromId)
            .zadd(`${this.namespace}:${toId}:${STATE_KEY.accepted}`, score, fromId)
            .zadd(`${this.namespace}:${fromId}:${STATE_KEY.accepted}`, score, toId)
            .exec(() => {
              debug(`${fromId} and ${toId} are now friends`);
              return resolve();
            });
        }
      });
    });
  }

  /**
   * unfollow() mutually removes friendship between two users and returns an empty Promise.
   * It removes each user from their `accepted` sets.
   */
  unfollow(fromId, toId) {
    return new Promise((resolve) => {
      this.client.multi()
        .zrem(`${this.namespace}:${fromId}:${STATE_KEY.accepted}`, toId)
        .zrem(`${this.namespace}:${toId}:${STATE_KEY.accepted}`, fromId)
        .exec(() => {
          debug(`Removed friendship between ${fromId} and ${toId}`);
          return resolve();
        });
    });
  }

  /**
   * requested() returns a Promise with a list of requested friends for a given `userId`.
   * Sorted by date of creation (newest to oldest).
   */
  requested(userId) {
    return this.getList(userId, STATE_KEY.requested);
  }

  /**
   * pending() returns a Promise with a list of pending friends for a given `userId`.
   * Sorted by date of creation (newest to oldest).
   */
  pending(userId) {
    return this.getList(userId, STATE_KEY.pending);
  }

  /**
   * accepted() returns a Promise with a list of accepted friends for a given `userId`.
   * Sorted by date of creation (newest to oldest).
   */
  accepted(userId) {
    return this.getList(userId, STATE_KEY.accepted);
  }

  /**
   * Alias for `accepted(userId)`.
   */
  friends(userId) {
    return this.accepted(userId);
  }

  /**
   * getList() returns a Redis sorted set for a given `userId` and state key.
   */
  getList(userId, state) {
    return new Promise((resolve) => {
      const key = `${this.namespace}:${userId}:${state}`;
      debug(`Returning list for: ${key}`);
      this.client.zrevrange(key, 0, -1, (err, res) => resolve(res));
    });
  }
}

module.exports = SocialDB;
