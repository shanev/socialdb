# SocialDB 

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

[Install and run Redis server](https://redis.io/topics/quickstart) if you are running this locally. 

Currently only supports the [redis](https://github.com/NodeRedis/node_redis) client. Follow installation instructions there for setting up the client.

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
	sd.requested(1).then((users) => {
		console.log(users);
	});
	// ['11']

	// get a list of user 11's pending requests
	sd.pending(11).then((users) => {
		console.log(users);
	});
	// ['1']	
});

// user 11 requets to follow user 1 back
sd.follow(11, 1).then(() => {
	// get a list of user 1's friends
	sd.accepted(1).then((users) => {
		console.log(users);
	});
	// ['11']

	// get a list of user 11's friends
	sd.accepted(11).then((users) => {
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
