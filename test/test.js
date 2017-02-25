const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

const follow = require('../index.js');

describe('Relationships', () => {
  before(() => {
    client.flushdb();
  });

  describe('#follow()', () => {
    it('should allow you to follow', () => {
      follow(1, 11, (result) => {
        assert(result);
        client.smembers(`user:${1}:requested`, (err, res) => {
          assert.equal(res[0], 11);
        });
        client.smembers(`user:${11}:pending`, (err, res) => {
          assert.equal(res[0], 1);
        });
      });
    });
  });
});
