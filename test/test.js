const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.log(err);
});

const SocialDB = require('../index.js');

const sd = new SocialDB(client);

describe('Testing SocialDB', () => {
  before(() => {
    client.flushdb();
  });

  describe('.follow()', () => {
    describe('initial request', () => {
      it('should add users to `requested` and `pending`', (done) => {
        sd.follow(1, 11, (success) => {
          assert(success);
          client.zcard(`user:${1}:requested`, (err, count) => {
            assert.equal(count, 1);
            client.zcard(`user:${11}:pending`, (err2, count2) => {
              assert.equal(count2, 1);
              done();
            });
          });
        });
      });
    });

    describe('reciprocal request', () => {
      it('should remove users from `requested` and `pending`', (done) => {
        sd.follow(11, 1, (success) => {
          assert(success);
          client.zcard(`user:${1}:requested`, (err, count) => {
            assert.equal(count, 0);
            client.zcard(`user:${11}:pending`, (err2, count2) => {
              assert.equal(count2, 0);
              done();
            });
          });
        });
      });

      it('should add users to `accepted`', (done) => {
        client.zcard(`user:${1}:accepted`, (err, count) => {
          assert.equal(count, 1);
          client.zcard(`user:${11}:accepted`, (err2, count2) => {
            assert.equal(count2, 1);
            done();
          });
        });
      });
    });
  });

  describe('.unfollow()', () => {
    it('should mututally unfollow two users', (done) => {
      sd.unfollow(1, 11, (success) => {
        assert(success);
        client.zcard(`user:${1}:accepted`, (err, count) => {
          assert.equal(count, 0);
          client.zcard(`user:${11}.accepted`, (err2, count2) => {
            assert.equal(count2, 0);
            done();
          });
        });
      });
    });
  });

  describe('.requested()', () => {
    client.flushdb();
    it('should get a list of requested followers', (done) => {
      sd.requested(1, (users) => {
        assert.equal(users.length, 0);
        done();
      });
    });

    it('should get a list of requested followers', (done) => {
      sd.follow(1, 11, (success) => {
        assert(success);
        sd.requested(1, (users) => {
          assert.equal(users.length, 1);
          done();
        });
      });
    });
  });

  describe('.pending()', () => {
    client.flushdb();
    it('should get a list of pending followers', (done) => {
      sd.pending(1, (users) => {
        assert.equal(users.length, 0);
        done();
      });
    });

    it('should get a list of pending followers', (done) => {
      sd.follow(1, 11, (success) => {
        assert(success);
        sd.pending(11, (users) => {
          assert.equal(users.length, 1);
          done();
        });
      });
    });
  });

  describe('.accepted()', () => {
    client.flushdb();
    it('should get a list of accepted followers', (done) => {
      sd.accepted(1, (users) => {
        assert.equal(users.length, 0);
        done();
      });
    });

    it('should get a list of accepted followers', (done) => {
      sd.follow(1, 11, (success) => {
        assert(success);
        sd.follow(11, 1, (success2) => {
          assert(success2);
          sd.accepted(11, (users) => {
            assert.equal(users.length, 1);
            sd.accepted(1, (users2) => {
              assert.equal(users2.length, 1);
              done();
            });
          });
        });
      });
    });
  });
});
