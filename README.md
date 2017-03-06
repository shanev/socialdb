# SocialDB 

[![Build Status](https://travis-ci.org/shanev/socialdb.svg?branch=master)](https://travis-ci.org/shanev/socialdb)

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

## API
* follow(fromId, toId)
* unfollow(fromId, toId)
* requested(userId)
* pending(userId)
* accepted(userId)
* friends(userId) (alias of accepted())

## Usage

### Step 1: Initialize an instance of SocialDB with a Redis client

[Install and run Redis server](https://redis.io/topics/quickstart) if running locally. 

Currently only supports the [redis](https://github.com/NodeRedis/node_redis) client. Follow installation instructions there for setting up the client.

```javascript
const redis = require('redis').createClient();

const SocialDB = require('socialdb');

const sd = new SocialDB(redis);
```

### Step 2: Profit

```javascript
// user 2 requests to follow user 3
sd.follow(2, 3)
	// get a list of user 2's requested friends
	.then(() => sd.requested(2))
	.then((users) => {
		console.log(users); // ['3']
	})
	// get a list of user 3's friends with pending requests
	.then(() => sd.pending(3))
	.then((users) => {
  		console.log(users); // ['2']
	});

// user 3 requests to follow user 2 back
sd.follow(3, 2)
	// get a list of user 2's friends
	.then(() => sd.friends(2))
	.then((users) => {
  		console.log(users); // ['3']
	})
	// get a list of user 3's friends
	.then(() => sd.friends(3))
	.then((users) => {
  		console.log(users); // ['2']
	});

// user 2 requests to unfollow user 3
sd.unfollow(2, 3)
	// get a list of user 2's friends
	.then(() => sd.friends(2))
	.then((users) => {
  		console.log(users); // []
	})
	// get a list of user 3's friends
	.then(() => sd.friends(3))
	.then((users) => {
  		console.log(users); // []
	});
```

SocialDB also works with async/await available in Node 7.6+. Witness:

```javascript
await sd.follow(2,3);
var users = await sd.requested(2);
console.log(users); // ['3']
users = await sd.pending(3);
console.log(users); // ['2']
```

## Error Handling

Currently SocialDB only throws an error on initialization if you don't supply a Redis client.
All other errors shoud be handled using the Redis error handler, since SocialDB is basically a
wrapper around Redis commands.

```javascript
client.on('error', (err) => {
  // handle the error
  console.log(err);
});
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

## Acknowledgements

Thanks [@mattinsler](https://github.com/mattinsler) for initial code review.

## License

MIT
