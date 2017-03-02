const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

// this is how redis errors are handled
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
        sd.follow(1, 11).then(() => {
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
        sd.follow(11, 1).then(() => {
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
      sd.unfollow(1, 11).then(() => {
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
    it('should get a list of requested followers', (done) => {
      sd.requested(1).then((users) => {
        assert.equal(users.length, 0);
        done();
      });
    });

    it('should get a list of requested followers', (done) => {
      sd.follow(1, 11).then(() => {
        sd.requested(1).then((users) => {
          assert.equal(users.length, 1);
          done();
        });
      });
    });
  });

  describe('.pending()', () => {
    it('should get a list of pending followers', (done) => {
      sd.pending(1).then((users) => {
        assert.equal(users.length, 0);
        done();
      });
    });

    it('should get a list of pending followers', (done) => {
      sd.follow(1, 11).then(() => {
        sd.pending(11).then((users) => {
          assert.equal(users.length, 1);
          done();
        });
      });
    });
  });

  describe('.accepted()', () => {
    client.flushdb(() => {
      it('should get a list of accepted followers', (done) => {
        sd.accepted(1).then((users) => {
          assert.equal(users.length, 0);
          done();
        });
      });
    });

    it('should get a list of accepted followers', (done) => {
      sd.follow(1, 11).then(() => {
        sd.follow(11, 1).then(() => {
          sd.accepted(11).then((users) => {
            assert.equal(users.length, 1);
            sd.accepted(1).then((users2) => {
              assert.equal(users2.length, 1);
              done();
            });
          });
        });
      });
    });
  });

  describe('.friends()', () => {
    client.flushdb(() => {
      it('should get a list of accepted followers', (done) => {
        sd.friends(1).then((users) => {
          assert.equal(users.length, 0);
          done();
        });
      });
    });

    it('should get a list of accepted followers', (done) => {
      sd.follow(1, 11).then(() => {
        sd.follow(11, 1).then(() => {
          sd.friends(11).then((users) => {
            assert.equal(users.length, 1);
            sd.friends(1).then((users2) => {
              assert.equal(users2.length, 1);
              done();
            });
          });
        });
      });
    });
  });
});
