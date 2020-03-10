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
        } catch(err) {
            console.log("RedisClient: Erreur..");
            console.log(err);
        }
    }

    async quickRedis() {
        await this.loginRedis();
        return {
            get: async (key) => {
                let toReturn = await this.getInstance().get(key);
                console.log("RedisClient: Commande exécuté: GET " + key);
                this.logoutRedis();
                return toReturn;
            }, set: async (key, value) => {
                let toReturn = await this.getInstance().set(key, value);
                console.log("RedisClient: Commande exécuté: SET " + key + " " + value);
                this.logoutRedis();
                return toReturn;
            }
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