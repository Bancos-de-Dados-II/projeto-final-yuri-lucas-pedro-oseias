import { redis } from "../database/redis.ts";

export interface SessionData {
  userId: number;
  email: string;
  tipo: string;
  createdAt: string;
}

const DEFAULT_TTL_SECONDS = 86400; // 24 horas em segundos

export class SessionService {
  private getKey(token: string): string {
    return `session:${token}`;
  }

  // Cria uma nova sessão no Redis com TTL (Time To Live)
  async createSession(
    token: string,
    sessionData: SessionData,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
  ): Promise<void> {
    try {
      const key = this.getKey(token);
      await redis.set(key, JSON.stringify(sessionData), "EX", ttlSeconds);
    } catch (error) {
      console.error("Erro ao salvar sessão no Redis:", error);
    }
  }

  // Recupera os dados da sessão do Redis
  async getSession(token: string): Promise<SessionData | null> {
    try {
      const key = this.getKey(token);
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as SessionData;
    } catch (error) {
      console.error("Erro ao buscar sessão no Redis:", error);
      return null;
    }
  }

  // Verifica se a sessão está ativa no Redis
  async isSessionActive(token: string): Promise<boolean> {
    try {
      const key = this.getKey(token);
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Erro ao verificar sessão no Redis:", error);
      return false;
    }
  }

  // Destrói a sessão no Redis (Logout)
  async destroySession(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await redis.del(key);
    } catch (error) {
      console.error("Erro ao remover sessão do Redis:", error);
    }
  }
}

export const sessionService = new SessionService();
