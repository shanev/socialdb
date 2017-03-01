# SocialDB 

SocialDB is a Redis-backed social graph for Node.js. It uses a friend model similar to Facebook where two users have to follow each other to be friends. All operations run as asynchronous atomic transactions, so the database is never left in an invalid state.

## Installation

```sh
npm install socialdb --save
```

## API
* follow(fromId, toId)
* unfollow(fromId, toId)
* requested(userId)
* pending(userId)
* accepted(userId)

## Usage

### Step 1: Initialize an instance of SocialDB with a Redis client

[Install and run Redis server](https://redis.io/topics/quickstart). 

Currently only supports the [redis](https://github.com/NodeRedis/node_redis) client. Follow installation instructions there if you don't have Redis installed.

```javascript
const redis = require('redis').createClient();

const SocialDB = require('socialdb');

const sd = new SocialDB(redis);
```

### Step 2: Profit

```javascript
// user 1 requests to follow user 11
sd.follow(1, 11).then(() => {
	// get a list of user 1's requested friends
	sd.requested(1, (users) => {
		console.log(users);
	});
	// ['11']

	// get a list of user 11's pending requests
	sd.pending(11, (users) => {
		console.log(users);
	});
	// ['1']	
});

// user 11 requets to follow user 1 back
sd.follow(11, 1).then(() => {
	// get a list of user 1's friends
	sd.accepted(1, (users) => {
		console.log(users);
	});
	// ['11']

	// get a list of user 11's friends
	sd.accepted(11, (users) => {
		console.log(users);
	});
	// ['1']	
});

// user 1 requests to unfollow user 11
// both are removed from each other's `accepted` list
sd.unfollow(1, 11).then(() => {
	// see ya, don't wanna be ya user 11!
});
```

## Tests

```sh
npm install
npm test
```

## Dependencies

- [debug](https://github.com/visionmedia/debug): small debugging utility
- [redis](https://github.com/NodeRedis/node_redis): Redis client library

## License

MIT
