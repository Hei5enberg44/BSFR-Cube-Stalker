const Redis = require("ioredis");
//const Redis = require("async-redis");

class RedisClient {

    constructor(opt) {
        this.host = opt.config.redis.host;
        this.port = opt.config.redis.port;
        this.password = opt.config.redis.password;
        this.database = opt.config.redis.database;

        this.redisInstance = new Redis({
            port: this.port,
            host: this.host,
            password: this.password,
            db: this.database
        });
    }

    /*async loginRedis() {
        try {
            this.redisInstance = Redis.create(this.port, this.host);
            this.redisInstance.auth(this.password);
            this.redisInstance.select(this.database);
        } catch(err) {
            console.log("RedisClient: Erreur..");
            console.log(err);
        }
    }*/

    async quickRedis() {
        return {
            get: async (key) => {
                let toReturn = await this.getInstance().get(key);
                console.log("RedisClient: Commande exécuté: GET " + key);
                return toReturn;
            }, set: async (key, value) => {
                let toReturn = await this.getInstance().set(key, value);
                console.log("RedisClient: Commande exécuté: SET " + key + " " + value);
                return toReturn;
            }, del: async (key, value) => {
                let toReturn = await this.getInstance().del(key);
                console.log("RedisClient: Commande exécuté: DEL " + key + " " + value);
                return toReturn;
            }
        }
    }

    async dirtyQuickRedis() {
        return {
            get: async (key) => {
                let toReturn = await this.redisInstance.get(key);
                console.log("RedisClient: Commande exécuté: GET " + key);
                return toReturn;
            }, set: async (key, value) => {
                let toReturn = await this.redisInstance.get(key, value);
                console.log("RedisClient: Commande exécuté: SET " + key + " " + value);
                return toReturn;
            }
        }
    }

    logoutRedis() {
        this.redisInstance.disconnect();
    }

    getInstance() {
        return this.redisInstance;
    }

}

module.exports = RedisClient;