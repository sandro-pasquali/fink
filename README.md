# Fink

Subscribe to Redis keyspace notifications.

To use keyspace notifications you must enable them. They are not enabled in Redis by default.

You will need to set `--notify-keyspace-events` so that the kind of notifications you want to track will be emitted.

Consult the [Redis documentation](http://redis.io/topics/notifications). 

## Testing

You will need Redis >=2.8 installed. If you have a password on your db, you will need to modify the test suite to accomodate that. Same if Redis is not @ `localhost:6379`.

`npm test`

## Usage

`Fink` returns a `Promise`.

```
let fink = require('fink');

fink(<options>).then((<finkApi>) => { 

    <finkApi>.subscribe(<keyspace | keyevent>, [key || eventName]);
    ...
    <finkApi>.unsubscribe(<keyspace | keyevent>, [key || eventName]);  
    ...
    <finkApi>.on('message', (msg) => {
    
        // Given : <finkApi>.subscribe('keyspace', 'foo')
        // On : someRedisClient.set('foo', 1)
        // #msg looks like:
        
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

## Options

Options track those for the [`redis` module](https://github.com/NodeRedis/node_redis#options-is-an-object-with-the-following-possible-properties)



