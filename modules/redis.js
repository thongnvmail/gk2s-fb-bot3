'use strict';
//
//  redis.js
//  connect to redis client

/**
 * Redis Client Wrapper.
 */
var path = require('path'),
    redis = require('redis'),
    events = require('events'),
    util = require('util');

function RedisClient (resdis_url, db) {
    events.EventEmitter.call(this);

    var self = this;
    self.db = db || 0;
    self.prefix = "";

    self.client = redis.createClient(resdis_url, {
        detect_buffers : true
    });

    self.client.on('error', function (err) {
        self.emit('error', err);
    });

    self.client.on('connect', function () {
        self.emit('connect');
    });

    self.client.on('end', function () {
        self.emit('end');
    });

    self.client.on('message', function (channel, message) {
        self.emit('message', channel, message);
    });
}

util.inherits(RedisClient, events.EventEmitter);

/**
 * Get redis key with internal prefix
 *
 * @param key
 * @returns
 */
RedisClient.prototype.getKey = function (key) {
    return util.format('%s%s', this.prefix, key);
};

/**
 * Set key - value
 *
 * @param key
 * @param value
 * @param handler
 */
RedisClient.prototype.set = function (key, value, handler) {
    this.setWithDb(null, key, value, handler);
};

/**
 * Expire a key
 *
 * @param key
 * @param seconds
 * @param handler
 */
RedisClient.prototype.expire = function (key, seconds, handler) {
    this.expireWithDb(null, key, seconds, handler);
};

/**
 * Get value from key
 *
 * @param key
 * @param handler
 */
RedisClient.prototype.get = function (key, handler) {
    this.getWithDb(null, key, handler);
};

/**
 * Increment value from key
 *
 * @param key
 * @param handler
 */
RedisClient.prototype.incr = function (key, handler) {
    this.incrWithDb(null, key, handler);
};

/**
 * Decrement value from key
 *
 * @param key
 * @param handler
 */
RedisClient.prototype.decr = function (key, handler) {
    this.decrWithDb(null, key, handler);
};

/**
 * Set hash key - value
 *
 * @param hashKey
 * @param obj
 * @param handler
 */
RedisClient.prototype.hmset = function (hashKey, obj, handler) {
    this.hmsetWithDb(null, hashKey, obj, handler);
};

/**
 * Get hash key - value
 *
 * @param key
 * @param obj
 * @param handler
 */
RedisClient.prototype.hgetall = function (hashKey, handler) {
    this.hgetallWithDb(null, hashKey, handler);
};

/**
 * Set key - value
 *
 * @param db
 * @param key
 * @param value
 * @param handler
 */
RedisClient.prototype.setWithDb = function (db, key, value, handler) {
    var self = this;

    var redisKey = this.getKey(key);

    self.client.select(db || self.db, function () {
        self.client.set(redisKey, JSON.stringify(value), function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Expire a key
 *
 * @param db
 * @param key
 * @param seconds
 * @param handler
 */
RedisClient.prototype.expireWithDb = function (db, key, seconds, handler) {
    var self = this;

    var redisKey = this.getKey(key);

    self.client.select(db || self.db, function () {
        self.client.expire(redisKey, seconds, function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Get value from key
 *
 * @param db
 * @param key
 * @param handler
 */
RedisClient.prototype.getWithDb = function (db, key, handler) {
    var self = this;

    var redisKey = this.getKey(key);

    self.client.select(db || self.db, function () {
        self.client.get(redisKey, function (err, value) {
            handler(err, JSON.parse(value));
        });
    });
};

/**
 * Increment value from key
 *
 * @param db
 * @param key
 * @param handler
 */
RedisClient.prototype.incrWithDb = function (db, key, handler) {
    var self = this;

    var redisKey = this.getKey(key);

    self.client.select(db || self.db, function () {
        self.client.incr(redisKey, function (err, value) {
            handler(err, JSON.parse(value));
        });
    });
};

/**
 * Decrement value from key
 *
 * @param db
 * @param key
 * @param handler
 */
RedisClient.prototype.decrWithDb = function (db, key, handler) {
    var self = this;

    var redisKey = this.getKey(key);

    self.client.select(db || self.db, function () {
        self.client.decr(redisKey, function (err, value) {
            handler(err, JSON.parse(value));
        });
    });
};

/**
 * Set hash key - value
 *
 * @param db
 * @param hashKey
 * @param obj
 * @param handler
 */
RedisClient.prototype.hmsetWithDb = function (db, hashKey, obj, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    Object.keys(obj).forEach(function (k) {
        obj[k] = JSON.stringify(obj[k]);
    });

    self.client.select(db || self.db, function () {
        self.client.hmset(redisHashKey, obj, function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Get hash key - value
 *
 * @param db
 * @param key
 * @param handler
 */
RedisClient.prototype.hgetallWithDb = function (db, hashKey, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    self.client.select(db || self.db, function () {
        self.client.hgetall(redisHashKey, function (err, obj) {
            if (err) {
                return handler(err);
            }

            if (obj) {
                Object.keys(obj).forEach(function (k) {
                    obj[k] = JSON.parse(obj[k]);
                });
            }

            handler(err, obj);
        });
    });
};

/**
 * Get field key - value of hash key
 *
 * @param db
 * @param hashKey
 * @param fieldKey
 * @param handler
 */
RedisClient.prototype.hgetWithDb = function (db, hashKey, fieldKey, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    var args = [
            redisHashKey, `${fieldKey}`
    ];

    self.client.select(db || self.db, function () {
        self.client.send_command('hget', args, function (err, obj) {
            if (err) {
                return handler(err);
            }

            if (obj) {
                obj = JSON.parse(obj);
            }

            handler(err, obj);
        });
    });
};

/**
 * Get multi field keys - value of hash key
 *
 * @param db
 * @param hashKey
 * @param fieldKeys
 * @param handler
 */
RedisClient.prototype.hmgetWithDb = function (db, hashKey, fieldKeys, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    var args = [redisHashKey].concat(fieldKeys);

    self.client.select(db || self.db, function () {
        self.client.send_command('hmget', args, function (err, data) {
            if (err) {
                return handler(err);
            }
            handler(err, data? data: []);
        });
    });
};

/**
 * Get multiple field keys - value of hash key
 *
 * @param hashKey
 * @param fieldKeys
 * @param handler
 */
RedisClient.prototype.hmget = function (hashKey, fieldKeys, handler) {
    this.hmgetWithDb(null, hashKey, fieldKeys, handler);
};

/**
 * Get field key - value of hash key
 *
 * @param hashKey
 * @param fieldKey
 * @param handler
 */
RedisClient.prototype.hget = function (hashKey, fieldKey, handler) {
    this.hgetWithDb(null, hashKey, fieldKey, handler);
};

/**
 * Set field key - value of hash key
 *
 * @param db
 * @param hashKey
 * @param fieldKey
 * @param fieldValue
 * @param handler
 */
RedisClient.prototype.hsetWithDb = function (db, hashKey, fieldKey, fieldValue, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    var obj = JSON.stringify(fieldValue);

    var args = [
            redisHashKey, `${fieldKey}`, obj
    ];

    self.client.select(db || self.db, function () {
        self.client.send_command('hset', args, function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Set field key - value of hash key
 *
 * @param hashKey
 * @param fieldKey
 * @param fieldValue
 * @param handler
 */
RedisClient.prototype.hset = function (hashKey, fieldKey, fieldValue, handler) {
    this.hsetWithDb(null, hashKey, fieldKey, fieldValue, handler);
};

/**
 * Remove field key of hash key
 *
 * @param db
 * @param hashKey
 * @param fieldKey
 * @param handler
 */
RedisClient.prototype.hdelWithDb = function (db, hashKey, fieldKey, handler) {
    var self = this;

    var redisHashKey = this.getKey(hashKey);

    var args = [
            redisHashKey, `${fieldKey}`
    ];

    self.client.select(db || self.db, function () {
        self.client.send_command('hdel', args, function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Remove field key of hash key
 *
 * @param hashKey
 * @param fieldKey
 * @param handler
 */
RedisClient.prototype.hdel = function (hashKey, fieldKey, handler) {
    this.hdelWithDb(null, hashKey, fieldKey, handler);
};

/**
 * Remove key or hash key
 *
 * @param db
 * @param key
 * @param handler
 */
RedisClient.prototype.delWithDb = function (db, key, handler) {
    var self = this;

    var redisHashKey = this.getKey(key);

    var args = [
        redisHashKey
    ];

    self.client.select(db || self.db, function () {
        self.client.send_command('del', args, function (err, success) {
            handler(err, success);
        });
    });
};

/**
 * Remove key or hash key
 *
 * @param key
 * @param handler
 */
RedisClient.prototype.del = function (key, handler) {
    this.delWithDb(null, key, handler);
};


/**
 * get redis client instance
 */
RedisClient.prototype.getClient = function () {
    return this.client;
};

/**
 * open a connection to redis server
 * author : dientn
 */
//var redisClient = new RedisClient(process.env.REDIS_URL);
var redisClient = new RedisClient("redis://h:p589b338fc23b2252cc506147750a41d7420caa33253e364978879361d69883ff@ec2-174-129-10-210.compute-1.amazonaws.com:13419");

redisClient.on('error', function (err) {
    console.error(err, `gk2s-fb-bot: Redis Client ERROR.`);
});

redisClient.on('connect', function () {
    console.log('gk2s-fb-bot: Redis Client CONNECTED %s', process.env.REDIS_URL);
});

redisClient.on('end', function () {
    console.error(new Error(), 'gk2s-fb-bot: Redis Client STOPPED.');
});

module.exports = redisClient;
