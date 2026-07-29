import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      tls: redisUrl.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    })
  : new Redis({
      host: redisHost,
      port: redisPort,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });

redis.on("connect", () => {
  console.log("✓ Conectado ao Redis na nuvem com sucesso.");
});

redis.on("error", (err) => {
  if (process.env.NODE_ENV !== "test") {
    console.warn("Aviso Redis (Cache/Sessão):", err.message);
  }
});

