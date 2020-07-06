const Redis = require("ioredis");

class RedisClient {

    /**
     * Constructeur du RedisClient
     * @param opt
     */
    constructor(opt) {
        this.host = opt.config.redis.host;
        this.port = opt.config.redis.port;
        this.password = opt.config.redis.password;
        this.database = opt.config.redis.database;

        // On instancie le client et on se connecte au serveur Redis
        this.redisInstance = new Redis({
            port: this.port,
            host: this.host,
            password: this.password,
            db: this.database
        });
    }

    /**
     * Wrapper pour les fonctions de ioredis.
     * @returns {Promise<{set: (function(*=, *=): *), get: (function(*=): *), del: (function(*=, *): *)}>}
     */
    async quickRedis() {
        return {
            get: async (key) => {
                let toReturn = await this.getInstance().get(key);
                console.log("RedisClient: Commande exécuté: GET " + key);
                return toReturn;
            }, set: async (key, value) => {
                let toReturn = await this.getInstance().set(key, value);
                console.log("RedisClient: Commande exécuté: SET " + key);
                return toReturn;
            }, del: async (key, value) => {
                let toReturn = await this.getInstance().del(key);
                console.log("RedisClient: Commande exécuté: DEL " + key);
                return toReturn;
            }
        }
    }

    /**
     * Getter pour l'instance Redis.
     * @returns {Redis}
     */
    getInstance() {
        return this.redisInstance;
    }

}

module.exports = RedisClient;
