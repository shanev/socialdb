const debug = require('debug')('redis-social-graph-tests');

const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  debug.err(err);
});

const SocialGraph = require('../index.js');

const sg = new SocialGraph(client);

describe('Relationships', () => {
  before(() => {
    client.flushdb();
  });

  describe('#follow()', () => {
    it('should allow you to follow', () => {
      sg.follow(1, 11).then((success) => {
        assert(success);
        client.smembers(`user:${1}:requested`, (err, res) => {
          assert.equal(res[0], 11);
        });
        client.smembers(`user:${11}:pending`, (err, res) => {
          assert.equal(res[0], 1);
        });
      });
    });
  });

  describe('#followers()', () => {
    it('should get a list of followers', () => {
      sg.followers();
    });
  });
});
