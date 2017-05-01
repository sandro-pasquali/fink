'use strict';

let util = require('util');
let path = require('path');
let chalk = require('chalk');
let _ = require('lodash');
let fink = require('../../lib');

let dbIdx = 0;

let client = require('redis-hook')({
    db: dbIdx
});

function flatten(res) {
    return res.reduce(function(prev, next) {
        prev.push(next.key, next.event);
        return prev;
    }, []);
}

module.exports = (test, Promise) => {

    return fink({
        db: dbIdx
    })
    .bind({
        messages: [] // see fink#on, below
    })

    // Subscribe specific keyspace 'foo', and to keyevent 'expire'.
    // Note that 'foo' key is used going forward for testing
    //
    .then(function(fink) {

        this.fink = fink;

        // General logger, which receives message events and stores
        // them in #messages. See below for usage.
        //
        this.fink.on('message', (msg) => {
            this.messages.push(msg)
        });

        return Promise.all([
            this.fink.subscribe('keyspace', 'foo'),
            this.fink.subscribe('keyevent', 'expire')
        ]);
    })
    .then(function(p) {
        return client.setAsync('foo', '22');
    })
    .then(function() {
        test.pass('Able to #set `foo`');
    })
    .catch(function(err) {
        test.fail('Unable to #set `foo`', err);
    })
    .then(function() {
        console.log(this.messages)
        test.deepEqual(
            flatten(this.messages),
            ['foo', 'set'],
            'Correct key event received');

        this.messages = [];
    })

    // Test #unsubscribe
    // Unsubscribe from 'foo' keyspace, and perform a set on 'foo'
    //
    .then(function() {
        return this.fink.unsubscribe('keyspace', 'foo');
    })
    .then(function(p) {
        return client.setAsync('foo', '22');
    })
    .then(function() {

        // Should not receive keyevent for 'foo'
        //
        test.deepEqual(
            flatten(this.messages),
            [],
            'Correctly unsubscribed from key event');
    })

    // Expire 'foo', should receive keyevent 'expire' and 'expired' events
    // (and not any 'foo' keyspace events)
    //
    .then(function() {
        this.messages = [];

        console.log(chalk.bgGreen.black(' ...adding 2000ms delay here...please wait :) '));

        return this.fink.subscribe('keyevent', 'expired');
    })
    .then(function() {
        return client.expireAsync('foo', 1);
    })
    .catch(function(err) {
        test.fail('Unable to #expire `foo`');
    })
    .delay(2000)
    .then(function() {
        test.deepEqual(
            flatten(this.messages),
            ['foo','expire', 'foo','expired'],
            'Correct expired events received');
    })
};