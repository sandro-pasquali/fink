'use strict';

let util = require('util');
let EventEmitter = require('events').EventEmitter;
let redisHook = require('redis-hook');
let _ = require('lodash');

// http://redis.io/topics/notifications
//
module.exports = opts => {

    opts = opts || {};

    let subscriber = redisHook(opts);
    let eventmap = {};
    let db = _.isInteger(opts.db) ? opts.db : 0;

    subscriber.on('error', err => {
        throw new Error(err);
    });

    util.inherits(Factory, EventEmitter);

    function Factory() {

        EventEmitter.call(this);

        // @param type {String} One of `keyspace` or `keyevent`
        // @param [key] {String}    Subscribe to a specific key, or all #type events (*)
        //
        this.subscribe = function(type, key) {

            key = key || '*';

            if(!~['keyevent','keyspace'].indexOf(type)) {
                throw new Error(`Invalid subscription key type sent to #subscribe: ${type}`);
            }

            // __<keyspace||keyevent>@<db idx>__:<some key>
            //
            return subscriber
            .psubscribeAsync(`__${type}@${db}__:${key}`)
            .then(function() {
                eventmap[type] = eventmap[type] || [];
                eventmap[type].push(key)
            });
        };

        this.unsubscribe = function(type, key) {

            key = key || '*';

            if(!~['keyevent','keyspace'].indexOf(type)) {
                throw new Error(`Invalid subscription key type sent to #unsubscribe: ${type}`);
            }

            // __<keyspace||keyevent>@<db idx>__:<some key>
            //
            return subscriber.punsubscribeAsync(`__${type}@${db}__:${key}`);
        };
    }

    // When the Redis subscriber is ready select the relevant db index
    // and start subscribing to keyspace notifications.
    //
    return subscriber
    .onAsync('ready')
    .then(() => subscriber.selectAsync(db))
    .then(() => {

        let api = new Factory();

        subscriber.on('pmessage', (pattern, channel, actedon) => {

            // (1) -> keyspace || keyevent
            // (2) -> An integer 0-9 (redis db idx)
            // (3) -> if keyspace then a db key; if keyevent then a redis action (set, del, etc)
            // #actedon = if keyspace then a redis action; if keyevent then a db key
            //
            let parse = channel.match(/__(keyspace|keyevent)@([0-9]+)__:([^\s]+)/i);

            let type = parse[1];

            let msg = {
                type : type,
                db : parse[2],
                pattern: pattern,
                channel: channel
            };

            if(type === 'keyspace') {

                msg.key = parse[3];
                msg.event = actedon;

            } else {

                msg.key = actedon;
                msg.event = parse[3];
            }

            api.emit('message', msg);
        });

        return api;
    })
    .catch(err => {
        throw new Error(`Unable to properly initialize Fink: ${err}`);
    });
};