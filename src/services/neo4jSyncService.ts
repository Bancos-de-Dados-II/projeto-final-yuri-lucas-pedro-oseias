import { getNeo4jSession } from "../database/neo4j.ts";
import { Usuario, Familia, Beneficiario, ProgramaSocial, Visita } from "../models/index.ts";

export class Neo4jSyncService {
  // Sincroniza nó de Usuário (administrador / assistente_social)
  async syncUsuario(usuario: { id: number; nome: string; email: string; tipo: string }) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MERGE (u:Usuario { id: $id })
        SET u.nome = $nome, u.email = $email, u.tipo = $tipo
        `,
        { id: Number(usuario.id), nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }
      );
      console.log(`[Neo4j] Nó Usuario #${usuario.id} (${usuario.nome}) sincronizado.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao sincronizar Usuario #${usuario.id}:`, error);
    } finally {
      await session.close();
    }
  }

  // Sincroniza nó de Família + recarrega aresta PROXIMO_DE com famílias num raio de 10km
  async syncFamilia(familia: { id: number; nomeResponsavel: string; endereco: string; rendaFamiliar?: number | null; qtdMembros: number; latitude: number; longitude: number }) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MERGE (f:Familia { id: $id })
        SET f.nomeResponsavel = $nomeResponsavel, 
            f.endereco = $endereco, 
            f.rendaFamiliar = $rendaFamiliar, 
            f.qtdMembros = $qtdMembros,
            f.latitude = $latitude,
            f.longitude = $longitude
        `,
        {
          id: Number(familia.id),
          nomeResponsavel: familia.nomeResponsavel,
          endereco: familia.endereco,
          rendaFamiliar: familia.rendaFamiliar ? Number(familia.rendaFamiliar) : null,
          qtdMembros: Number(familia.qtdMembros),
          latitude: Number(familia.latitude),
          longitude: Number(familia.longitude),
        }
      );
      console.log(`[Neo4j] Nó Familia #${familia.id} (${familia.nomeResponsavel}) sincronizado.`);

      // Atualiza arestas PROXIMO_DE para a família
      await this.syncProximoDeForFamilia(Number(familia.id));
    } catch (error) {
      console.error(`[Neo4j] Erro ao sincronizar Familia #${familia.id}:`, error);
    } finally {
      await session.close();
    }
  }

  // ARESTA 1: PERTENCE_A — Sincroniza nó de Beneficiário + Aresta (Beneficiario)-[:PERTENCE_A]->(Familia)
  async syncBeneficiario(beneficiario: { id: number; nome: string; cpf: string; situacaoSocial?: string | null; familiaId: number }) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MERGE (b:Beneficiario { id: $id })
        SET b.nome = $nome, b.cpf = $cpf, b.situacaoSocial = $situacaoSocial
        WITH b
        MATCH (f:Familia { id: $familiaId })
        MERGE (b)-[:PERTENCE_A]->(f)
        `,
        {
          id: Number(beneficiario.id),
          nome: beneficiario.nome,
          cpf: beneficiario.cpf,
          situacaoSocial: beneficiario.situacaoSocial || null,
          familiaId: Number(beneficiario.familiaId),
        }
      );
      console.log(`[Neo4j] Beneficiario #${beneficiario.id} + Aresta PERTENCE_A -> Familia #${beneficiario.familiaId} criada.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao sincronizar Beneficiario #${beneficiario.id}:`, error);
    } finally {
      await session.close();
    }
  }

  // Sincroniza nó de Programa Social
  async syncProgramaSocial(programa: { id: number; nome: string; descricao?: string | null; orgaoResponsavel?: string | null; ativo: boolean }) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MERGE (p:ProgramaSocial { id: $id })
        SET p.nome = $nome, p.descricao = $descricao, p.orgaoResponsavel = $orgaoResponsavel, p.ativo = $ativo
        `,
        {
          id: Number(programa.id),
          nome: programa.nome,
          descricao: programa.descricao || null,
          orgaoResponsavel: programa.orgaoResponsavel || null,
          ativo: Boolean(programa.ativo),
        }
      );
      console.log(`[Neo4j] Nó ProgramaSocial #${programa.id} (${programa.nome}) sincronizado.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao sincronizar ProgramaSocial #${programa.id}:`, error);
    } finally {
      await session.close();
    }
  }

  // ARESTA 2: PARTICIPA_DE — Cria relacionamento (Beneficiario)-[:PARTICIPA_DE]->(ProgramaSocial)
  async linkBeneficiarioPrograma(beneficiarioId: number, programaId: number) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MATCH (b:Beneficiario { id: $beneficiarioId })
        MATCH (p:ProgramaSocial { id: $programaId })
        MERGE (b)-[:PARTICIPA_DE]->(p)
        `,
        { beneficiarioId: Number(beneficiarioId), programaId: Number(programaId) }
      );
      console.log(`[Neo4j] Aresta (Beneficiario #${beneficiarioId})-[:PARTICIPA_DE]->(ProgramaSocial #${programaId}) criada.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao criar aresta PARTICIPA_DE:`, error);
    } finally {
      await session.close();
    }
  }

  // ARESTA 3: FOI_ATENDIDO_POR — Cria relacionamento (Beneficiario)-[:FOI_ATENDIDO_POR]->(Usuario) e (Usuario)-[:ATENDEU_VISITA]->(Beneficiario)
  async linkVisita(usuarioId: number, beneficiarioId: number) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MATCH (u:Usuario { id: $usuarioId })
        MATCH (b:Beneficiario { id: $beneficiarioId })
        MERGE (b)-[:FOI_ATENDIDO_POR]->(u)
        MERGE (u)-[:ATENDEU_VISITA]->(b)
        `,
        { usuarioId: Number(usuarioId), beneficiarioId: Number(beneficiarioId) }
      );
      console.log(`[Neo4j] Aresta (Beneficiario #${beneficiarioId})-[:FOI_ATENDIDO_POR]->(Usuario #${usuarioId}) criada.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao criar aresta FOI_ATENDIDO_POR:`, error);
    } finally {
      await session.close();
    }
  }

  // ARESTA 4: PROXIMO_DE — Calcula distância geográfica e cria (Familia)-[:PROXIMO_DE { distanciaKm }]->(Familia)
  async syncProximoDeForFamilia(familiaId: number, raioMaxKm: number = 10.0) {
    const session = getNeo4jSession();
    try {
      // Cypher calcula distância usando fórmula de Haversine ou cálculo geoespacial de pontos
      await session.run(
        `
        MATCH (f1:Familia { id: $familiaId })
        MATCH (f2:Familia)
        WHERE f1.id <> f2.id 
          AND f1.latitude IS NOT NULL AND f1.longitude IS NOT NULL
          AND f2.latitude IS NOT NULL AND f2.longitude IS NOT NULL
        WITH f1, f2, point.distance(
          point({ latitude: toFloat(f1.latitude), longitude: toFloat(f1.longitude) }),
          point({ latitude: toFloat(f2.latitude), longitude: toFloat(f2.longitude) })
        ) / 1000.0 AS distKm
        WHERE distKm <= $raioMaxKm
        MERGE (f1)-[r:PROXIMO_DE]->(f2)
        SET r.distanciaKm = round(distKm, 3)
        `,
        { familiaId: Number(familiaId), raioMaxKm: Number(raioMaxKm) }
      );
      console.log(`[Neo4j] Arestas PROXIMO_DE atualizadas para Familia #${familiaId} (Raio max: ${raioMaxKm} km).`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao calcular arestas PROXIMO_DE para Familia #${familiaId}:`, error);
    } finally {
      await session.close();
    }
  }

  // Recalcula todas as arestas PROXIMO_DE entre todas as famílias cadastradas
  async syncAllProximoDe(raioMaxKm: number = 10.0) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MATCH (f1:Familia), (f2:Familia)
        WHERE f1.id < f2.id 
          AND f1.latitude IS NOT NULL AND f1.longitude IS NOT NULL
          AND f2.latitude IS NOT NULL AND f2.longitude IS NOT NULL
        WITH f1, f2, point.distance(
          point({ latitude: toFloat(f1.latitude), longitude: toFloat(f1.longitude) }),
          point({ latitude: toFloat(f2.latitude), longitude: toFloat(f2.longitude) })
        ) / 1000.0 AS distKm
        WHERE distKm <= $raioMaxKm
        MERGE (f1)-[r:PROXIMO_DE]-(f2)
        SET r.distanciaKm = round(distKm, 3)
        `,
        { raioMaxKm: Number(raioMaxKm) }
      );
      console.log(`[Neo4j] Todas as arestas PROXIMO_DE entre famílias foram geradas no raio de ${raioMaxKm} km.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao gerar arestas PROXIMO_DE globais:`, error);
    } finally {
      await session.close();
    }
  }

  // Remove um nó e seus relacionamentos no Neo4j ao deletar no banco relacional
  async deleteNode(label: "Usuario" | "Familia" | "Beneficiario" | "ProgramaSocial", id: number) {
    const session = getNeo4jSession();
    try {
      await session.run(
        `
        MATCH (n:${label} { id: $id })
        DETACH DELETE n
        `,
        { id: Number(id) }
      );
      console.log(`[Neo4j] Nó ${label} #${id} removido.`);
    } catch (error) {
      console.error(`[Neo4j] Erro ao deletar nó ${label} #${id}:`, error);
    } finally {
      await session.close();
    }
  }

  // Sincronização completa de todos os nós e arestas (PERTENCE_A, PARTICIPA_DE, FOI_ATENDIDO_POR, PROXIMO_DE)
  async syncAllNodesFromDatabase() {
    console.log("[Neo4j] Iniciando sincronização completa de nós e arestas (PERTENCE_A, PARTICIPA_DE, FOI_ATENDIDO_POR, PROXIMO_DE)...");
    
    // 1. Usuários
    const usuarios = await Usuario.findAll();
    for (const u of usuarios) {
      await this.syncUsuario(u.toJSON());
    }

    // 2. Famílias
    const familias = await Familia.findAll();
    for (const f of familias) {
      await this.syncFamilia(f.toJSON());
    }

    // 3. Programas Sociais
    const programas = await ProgramaSocial.findAll();
    for (const p of programas) {
      await this.syncProgramaSocial(p.toJSON());
    }

    // 4. Beneficiários + Arestas PERTENCE_A e PARTICIPA_DE
    const beneficiarios = await Beneficiario.findAll({
      include: [{ model: ProgramaSocial, as: "programas" }],
    });
    for (const b of beneficiarios) {
      const bJson = b.toJSON();
      await this.syncBeneficiario(bJson);

      if (Array.isArray((b as any).programas)) {
        for (const prog of (b as any).programas) {
          await this.linkBeneficiarioPrograma(b.id, prog.id);
        }
      }
    }

    // 5. Visitas (Aresta FOI_ATENDIDO_POR: Beneficiario -> Usuario)
    const visitas = await Visita.findAll();
    for (const v of visitas) {
      await this.linkVisita(v.usuarioId, v.beneficiarioId);
    }

    // 6. Aresta PROXIMO_DE (Proximidade geográfica entre famílias)
    await this.syncAllProximoDe(10.0);

    console.log("[Neo4j] Sincronização completa de nós e arestas finalizada com sucesso!");
    return await this.getGraphStats();
  }

  // Retorna estatísticas de nós e relacionamentos no Neo4j
  async getGraphStats() {
    const session = getNeo4jSession();
    try {
      const nodesRes = await session.run(`
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
      `);

      const relsRes = await session.run(`
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(r) AS count
      `);

      const nodes: Record<string, number> = {};
      nodesRes.records.forEach(rec => {
        nodes[rec.get("label")] = Number(rec.get("count"));
      });

      const relationships: Record<string, number> = {};
      relsRes.records.forEach(rec => {
        relationships[rec.get("type")] = Number(rec.get("count"));
      });

      return { nodes, relationships };
    } catch (error) {
      console.error("[Neo4j] Erro ao obter estatísticas do grafo:", error);
      return { nodes: {}, relationships: {} };
    } finally {
      await session.close();
    }
  }

  // CONSULTA 1: Proximidade geográfica de Famílias (aresta PROXIMO_DE)
  async getProximidadeFamilias(raioMaxKm: number = 10.0) {
    const session = getNeo4jSession();
    try {
      const result = await session.run(
        `
        MATCH (f1:Familia)-[r:PROXIMO_DE]->(f2:Familia)
        WHERE r.distanciaKm <= $raioMaxKm
        RETURN f1.id AS familia1Id, f1.nomeResponsavel AS familia1Responsavel, f1.endereco AS familia1Endereco,
               f2.id AS familia2Id, f2.nomeResponsavel AS familia2Responsavel, f2.endereco AS familia2Endereco,
               r.distanciaKm AS distanciaKm
        ORDER BY r.distanciaKm ASC
        LIMIT 100
        `,
        { raioMaxKm: Number(raioMaxKm) }
      );

      return result.records.map(rec => ({
        familia1: {
          id: Number(rec.get("familia1Id")),
          nomeResponsavel: rec.get("familia1Responsavel"),
          endereco: rec.get("familia1Endereco"),
        },
        familia2: {
          id: Number(rec.get("familia2Id")),
          nomeResponsavel: rec.get("familia2Responsavel"),
          endereco: rec.get("familia2Endereco"),
        },
        distanciaKm: Number(rec.get("distanciaKm")),
      }));
    } catch (error) {
      console.error("[Neo4j] Erro na consulta de proximidade de famílias:", error);
      return [];
    } finally {
      await session.close();
    }
  }

  // CONSULTA 2: Sobreposição de Atendimentos (Beneficiários atendidos por mais de 1 usuário / assistente social)
  async getSobreposicaoAtendimentos() {
    const session = getNeo4jSession();
    try {
      const result = await session.run(`
        MATCH (b:Beneficiario)-[:FOI_ATENDIDO_POR]->(u:Usuario)
        WITH b, count(DISTINCT u) AS totalAtendentes, collect(DISTINCT { id: u.id, nome: u.nome, tipo: u.tipo }) AS atendentes
        RETURN b.id AS beneficiarioId, b.nome AS beneficiarioNome, b.cpf AS beneficiarioCpf, totalAtendentes, atendentes
        ORDER BY totalAtendentes DESC
      `);

      return result.records.map(rec => ({
        beneficiario: {
          id: Number(rec.get("beneficiarioId")),
          nome: rec.get("beneficiarioNome"),
          cpf: rec.get("beneficiarioCpf"),
        },
        totalAtendentes: Number(rec.get("totalAtendentes")),
        atendentes: rec.get("atendentes"),
      }));
    } catch (error) {
      console.error("[Neo4j] Erro na consulta de sobreposição de atendimentos:", error);
      return [];
    } finally {
      await session.close();
    }
  }

  // CONSULTA 3: Rede de Relacionamentos do Grafo (Visão integrada de Famílias, Programas e Atendimentos)
  async getRedeRelacionamentos() {
    const session = getNeo4jSession();
    try {
      const result = await session.run(`
        MATCH (b:Beneficiario)-[:PERTENCE_A]->(f:Familia)
        OPTIONAL MATCH (b)-[:PARTICIPA_DE]->(p:ProgramaSocial)
        OPTIONAL MATCH (b)-[:FOI_ATENDIDO_POR]->(u:Usuario)
        RETURN b.id AS beneficiarioId, b.nome AS beneficiarioNome,
               f.id AS familiaId, f.nomeResponsavel AS familiaResponsavel,
               collect(DISTINCT p.nome) AS programas,
               collect(DISTINCT u.nome) AS assistentesAtendentes
        LIMIT 100
      `);

      return result.records.map(rec => ({
        beneficiarioId: Number(rec.get("beneficiarioId")),
        beneficiarioNome: rec.get("beneficiarioNome"),
        familiaId: Number(rec.get("familiaId")),
        familiaResponsavel: rec.get("familiaResponsavel"),
        programas: rec.get("programas").filter(Boolean),
        assistentesAtendentes: rec.get("assistentesAtendentes").filter(Boolean),
      }));
    } catch (error) {
      console.error("[Neo4j] Erro na consulta de rede de relacionamentos:", error);
      return [];
    } finally {
      await session.close();
    }
  }
}

export const neo4jSyncService = new Neo4jSyncService();
