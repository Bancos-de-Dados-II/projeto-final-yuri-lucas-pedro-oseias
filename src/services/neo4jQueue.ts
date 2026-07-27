import { neo4jSyncService } from "./neo4jSyncService.ts";

export interface Neo4jSyncTask {
  id: string;
  type: 
    | "SYNC_USUARIO"
    | "SYNC_FAMILIA"
    | "SYNC_BENEFICIARIO"
    | "SYNC_PROGRAMA"
    | "LINK_BENEFICIARIO_PROGRAMA"
    | "LINK_VISITA"
    | "DELETE_NODE"
    | "SYNC_ALL";
  payload: any;
  createdAt: Date;
  attempts: number;
}

export class Neo4jAsyncQueueService {
  private queue: Neo4jSyncTask[] = [];
  private isProcessing: boolean = false;
  private totalProcessed: number = 0;
  private totalFailed: number = 0;

  // Adiciona uma tarefa de escrita do PostgreSQL para a fila assíncrona do Neo4j
  enqueue(type: Neo4jSyncTask["type"], payload: any) {
    const task: Neo4jSyncTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: new Date(),
      attempts: 0,
    };

    this.queue.push(task);

    // Dispara o processador em segundo plano assincronamente (setImmediate / non-blocking)
    setImmediate(() => this.processNextTask());
  }

  // Processa as tarefas da fila uma a uma em segundo plano sem bloquear a resposta HTTP do usuário
  private async processNextTask() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift()!;
    task.attempts++;

    try {
      switch (task.type) {
        case "SYNC_USUARIO":
          await neo4jSyncService.syncUsuario(task.payload);
          break;
        case "SYNC_FAMILIA":
          await neo4jSyncService.syncFamilia(task.payload);
          break;
        case "SYNC_BENEFICIARIO":
          await neo4jSyncService.syncBeneficiario(task.payload);
          break;
        case "SYNC_PROGRAMA":
          await neo4jSyncService.syncProgramaSocial(task.payload);
          break;
        case "LINK_BENEFICIARIO_PROGRAMA":
          await neo4jSyncService.linkBeneficiarioPrograma(task.payload.beneficiarioId, task.payload.programaId);
          break;
        case "LINK_VISITA":
          await neo4jSyncService.linkVisita(task.payload.usuarioId, task.payload.beneficiarioId);
          break;
        case "DELETE_NODE":
          await neo4jSyncService.deleteNode(task.payload.label, task.payload.id);
          break;
        case "SYNC_ALL":
          await neo4jSyncService.syncAllNodesFromDatabase();
          break;
      }

      this.totalProcessed++;
    } catch (error) {
      console.error(`[Neo4j Async Queue] Erro ao processar tarefa ${task.id} (${task.type}):`, error);
      
      // Re-tenta até 3 vezes se falhar
      if (task.attempts < 3) {
        console.log(`[Neo4j Async Queue] Re-enfileirando tarefa ${task.id} (Tentativa ${task.attempts}/3)...`);
        this.queue.push(task);
      } else {
        this.totalFailed++;
      }
    } finally {
      this.isProcessing = false;
      // Processa a próxima se houver itens pendentes na fila
      if (this.queue.length > 0) {
        setImmediate(() => this.processNextTask());
      }
    }
  }

  // Retorna o status da fila de propagação assíncrona
  getQueueStats() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
    };
  }
}

export const neo4jQueueService = new Neo4jAsyncQueueService();
