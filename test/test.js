const assert = require('assert');

const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.log(err);
});

const SocialGraph = require('../index.js');

const sg = new SocialGraph(client);

describe('Relationships', () => {
  before(() => {
    client.flushdb();
  });

  describe('#follow()', () => {
    it('should allow you to follow', (done) => {
      sg.follow(1, 11).then((success) => {
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
  });

  // describe('#followers()', () => {
  //   it('should get a list of followers', () => {
  //     sg.followers(1, (users) => {
  //       assert.equal(users.length, 5);
  //     });
  //   });
  // });
});
