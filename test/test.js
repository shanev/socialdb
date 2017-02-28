const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.log(err);
});

const SocialGraph = require('../index.js');

const sg = new SocialGraph(client);

describe('requesting friends', () => {
  before(() => {
    client.flushdb();
  });

  describe('.follow() initial request', () => {
    it('should add users to `requested` and `pending`', (done) => {
      sg.follow(1, 11, (success) => {
        assert(success);
        client.smembers(`user:${1}:requested`, (err, res) => {
          assert.equal(res[0], 11);
          client.smembers(`user:${11}:pending`, (err2, res2) => {
            assert.equal(res2[0], 1);
            done();
          });
        });
      });
    });

    describe('should query `pending`, `requested`, and `accepted`', () => {
      describe('.requested()', () => {
        it('should get a list of requested followers', (done) => {
          sg.requested(1, (users) => {
            assert.equal(users.length, 1);
            done();
          });
        });
      });

      describe('.pending()', () => {
        it('should get a list of pending followers', (done) => {
          sg.pending(11, (users) => {
            assert.equal(users.length, 1);
            done();
          });
        });
      });

      describe('.accepted()', () => {
        it('should get a list of accepted followers', (done) => {
          sg.accepted(1, (users) => {
            assert.equal(users.length, 0);
            done();
          });
        });
      });
    });
  });

  describe('.follow() reciprocal request', () => {
    it('should remove users from `requested` and `pending`', (done) => {
      sg.follow(11, 1, (success) => {
        assert(success);
        client.scard(`user:${1}:requested`, (err, res) => {
          assert.equal(res, 0);
          client.scard(`user:${11}:pending`, (err2, res2) => {
            assert.equal(res2, 0);
            done();
          });
        });
      });
    });

    it('should add users to `accepted`', (done) => {
      client.scard(`user:${1}:accepted`, (err, res) => {
        assert.equal(res, 1);
        client.scard(`user:${11}:accepted`, (err2, res2) => {
          assert.equal(res2, 1);
          done();
        });
      });
    });

    describe('should query `pending`, `requested`, and `accepted`', () => {
      describe('.requested()', () => {
        it('should get a list of requested followers', (done) => {
          sg.requested(1, (users) => {
            assert.equal(users.length, 0);
            done();
          });
        });
      });

      describe('.pending()', () => {
        it('should get a list of pending followers', (done) => {
          sg.pending(11, (users) => {
            assert.equal(users.length, 0);
            done();
          });
        });
      });

      describe('.accepted()', () => {
        it('should get a list of accepted followers', (done) => {
          sg.accepted(1, (users) => {
            assert.equal(users.length, 1);
            done();
          });
        });
      });
    });
  });

  describe('.unfollow()', () => {
    it('should mututally unfollow two users', (done) => {
      sg.unfollow(1, 11, (success) => {
        assert(success);
        client.scard(`user:${1}:accepted`, (err, res) => {
          assert.equal(res, 0);
          client.scard(`user:${11}.accepted`, (err2, res2) => {
            assert.equal(res2, 0);
            done();
          });
        });
      });
    });
  });
});
