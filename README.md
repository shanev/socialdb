# SocialDB 

[![npm version](https://badge.fury.io/js/socialdb.svg)](https://badge.fury.io/js/socialdb)
[![Build Status](https://travis-ci.org/shanev/socialdb.svg?branch=master)](https://travis-ci.org/shanev/socialdb)
[![codecov](https://codecov.io/gh/shanev/socialdb/branch/master/graph/badge.svg)](https://codecov.io/gh/shanev/socialdb)
[![Dependencies](https://david-dm.org/shanev/socialdb.svg)](https://david-dm.org/shanev/socialdb)

SocialDB is a Redis-backed social graph for Node.js. It uses a friend model similar to Facebook where two users have to follow each other to be friends. 

All operations run as asynchronous atomic transactions, so the database is never left in an invalid state. All methods return native Promises. Redis is the ideal storage mechanism for friend relationships, since they can be stored as sets. With sets you can do interesting things with set intersection to find mutual friends, recommended friends, etc. SocialDB stores friend relationships as sorted sets ordered by date.

## Installation

If you are using yarn:

```sh
yarn add socialdb
```

or npm:

```sh
npm install socialdb --save
```

Run Redis server if running locally:
```sh
redis-server
```
Check out [Redis quickstart](https://redis.io/topics/quickstart) to install.

## API
* follow(fromId, toId)
* unfollow(fromId, toId)
* invite(userId, someId)
* block(fromId, toId)
* requested(userId)
* pending(userId)
* accepted(userId)
* friends(userId) (alias of accepted())

## Usage

### Step 1: Initialize an instance of SocialDB

Require SocialDB:
```js
const SocialDB = require('socialdb');
```

Initialize SocialDB, connecting to a [Redis client](https://github.com/NodeRedis/node_redis):
```js
const sd = new SocialDB(redisClient);
```

### Step 2: Profit

Note: This example uses async/await, only available in Node 7.6+.

```javascript
// user 2 requests to follow user 3
await sd.follow(2, 3)
console.log(await sd.requested(2)); 
// ['3']
console.log(await sd.pending(3)); 
// ['2']

// user 3 requests to follow user 2 back
await sd.follow(3, 2);
console.log(await sd.friends(2)); 
// ['3']
console.log(await sd.friends(3)); 
// ['2']

// user 2 requests to unfollow user 3
await sd.unfollow(2, 3);
console.log(await sd.friends(2)); 
// []
console.log(await sd.friends(3)); 
// []

// user 2 invites user with phone number +14153337777
await sd.invite(2, '+14153337777')
console.log(await sd.invited('+14153337777')); 
// [2]
```

## Debugging

Add `DEBUG=socialdb` to your node start script to see debug output. i.e:

```sh
DEBUG=socialdb node server.js
```

## Tests

```sh
yarn install
# npm install works too
npm test
```

## Author

Shane Vitarana :: [http://shanev.me](http://shanev.me) :: [@shanev](https://twitter.com/shanev)
