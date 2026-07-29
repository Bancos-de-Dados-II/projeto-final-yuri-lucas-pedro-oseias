import { getMongoDb } from "../database/mongodb.ts";

export interface BeneficiarioLog {
  beneficiarioId: number;
  usuarioId: number;
  timestamp: Date;
  acao: "CREATE" | "UPDATE" | "DELETE";
  dadosAntes?: any;
  dadosDepois?: any;
}

export class BeneficiarioLogRepository {
  private getCollection() {
    return getMongoDb().collection<BeneficiarioLog>("beneficiarios_logs");
  }

  async saveLog(log: Omit<BeneficiarioLog, "timestamp">): Promise<void> {
    const colecao = "beneficiarios_logs";
    const logDoc: BeneficiarioLog = {
      ...log,
      timestamp: new Date(),
    };
    console.log(`[MongoDB Debug] Tentando salvar log na coleção [${colecao}]:`, JSON.stringify(logDoc, null, 2));
    try {
      const result = await this.getCollection().insertOne(logDoc);
      console.log(`✓ [MongoDB] Documento inserido com sucesso na coleção [${colecao}]. ID gerado: ${result.insertedId}`);
    } catch (error: any) {
      console.error(`❌ [MongoDB Erro] Falha ao salvar log na coleção [${colecao}] para beneficiário #${log.beneficiarioId}:`, error?.message || error);
    }
  }

  async getLogsByBeneficiarioId(beneficiarioId: number): Promise<BeneficiarioLog[]> {
    try {
      return await this.getCollection().find({ beneficiarioId }).sort({ timestamp: -1 }).toArray();
    } catch (error) {
      console.error(`Erro ao buscar logs do beneficiário #${beneficiarioId}:`, error);
      return [];
    }
  }
}

export const beneficiarioLogRepository = new BeneficiarioLogRepository();
