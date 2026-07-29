import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    })
  : new Redis({
      host: redisHost,
      port: redisPort,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });

redis.on("error", (err) => {
  // Log silencioso para evitar flood nos logs em ambientes sem Redis
  if (process.env.NODE_ENV !== "test") {
    console.error("Aviso Redis:", err.message);
  }
});

