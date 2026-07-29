import { MongoClient, Db } from "mongodb";

const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://admin:admin@127.0.0.1:27017/geopb?authSource=admin";
const dbName = process.env.MONGO_DB_NAME || "geopb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  try {
    const isCloud = mongoUrl.includes("mongodb+srv://") || mongoUrl.includes("mongodb.net");
    client = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
      ...(isCloud ? { tls: true, tlsAllowInvalidCertificates: true } : {}),
    });
    await client.connect();
    db = client.db(dbName);
    console.log("Conectado ao MongoDB com sucesso.");
    return db;
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", (error as any)?.message || error);
    throw error;
  }
}

export function getMongoDb(): Db {
  if (!db) {
    throw new Error("MongoDB não conectado. Chame connectMongo primeiro.");
  }
  return db;
}
