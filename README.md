# Fink

Subscribe to Redis keyspace notifications.

## Installation

```
require('fink')([options]).then(finkAPI => { ... })
```

Note that you are working with a `Promise`.

You will need `Redis` >=2.8 installed. 

To use keyspace notifications you must enable them in `Redis` (for example via `redis-cli> config set notify-keyspace-events KEA`). They are not enabled in `Redis` by default.

Consult the [`Redis` documentation](http://redis.io/topics/notifications). 

## Options

Options for `fink` track those for the [`redis` module](https://github.com/NodeRedis/node_redis#options-is-an-object-with-the-following-possible-properties). You are setting options for the `Redis` client here.

## Testing

`npm test`

If you have a password on your db, you will need to modify the test suite to accomodate that. Same if `Redis` is not @ `localhost:6379`.

## Usage

`fink` returns a `Promise`.

```
let fink = require('fink')(<redis options>)

fink.then(finkApi => { 

    finkApi.subscribe((keyspace | keyevent), [key || eventName]);
    ...
    finkApi.unsubscribe((keyspace | keyevent), [key || eventName]);  
    ...
    finkApi.on('message', (msg) => {
    
        // Given : finkApi.subscribe('keyspace', 'foo')
        // On : someRedisClient.set('foo', 1)
        // #msg looks like:
        //
        {   type: 'keyspace',
            db: '0',
            pattern: '__keyspace@0__:foo',
            channel: '__keyspace@0__:foo',
            key: 'foo',
            event: 'set' 
        }
    }
}
```

If second argument is not sent to `subscribe` subscription will be to **all** `keyspace` or `keyevent` events.


