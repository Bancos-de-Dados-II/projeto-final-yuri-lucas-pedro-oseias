import neo4j, { Driver, Session } from "neo4j-driver";

const neo4jUri = process.env.NEO4J_URI || "bolt://127.0.0.1:7687";
const neo4jUser = process.env.NEO4J_USER || "neo4j";
const neo4jPassword = process.env.NEO4J_PASSWORD || "password";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword), {
      maxConnectionPoolSize: 50,
      connectionTimeout: 5000,
    });
  }
  return driver;
}

export function getNeo4jSession(): Session {
  return getNeo4jDriver().session();
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
