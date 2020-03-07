const Redis = require("redis");
const asyncRedis = require("async-redis");

class RedisClient {

    constructor(opt) {
        this.host = opt.config.redis.host;
        this.port = opt.config.redis.port;
        this.password = opt.config.redis.password;
        this.database = opt.config.redis.database;
    }

    async loginRedis() {
        try {
            this.redisInstance = Redis.createClient(this.port, this.host);
            this.redisInstance.auth(this.password);
            this.redisInstance.select(this.database);
            console.log("RedisClient: Connecté.")
        } catch(err) {
            console.log("RedisClient: Erreur..");
            console.log(err);
        }
    }

    logoutRedis() {
        this.redisInstance.end(true);
    }

    getInstance() {
        return asyncRedis.decorate(this.redisInstance);
    }

}

module.exports = RedisClient;