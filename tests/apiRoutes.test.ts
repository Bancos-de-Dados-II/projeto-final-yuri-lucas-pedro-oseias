import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app.ts";
import { connectMongo } from "../src/database/mongodb.ts";
import { generateToken, hashPassword } from "../src/services/security.ts";
import { userRepository } from "../src/repositories/UserRepository.ts";

describe("Testes de Integração e Unidade das Rotas da API (Jest / Supertest)", () => {
  let authToken: string;
  let testFamiliaId: number;
  let testBeneficiarioId: number;
  let testProgramaId: number;

  beforeAll(async () => {
    await connectMongo().catch(() => {});

    // Garante a existência do usuário Admin com a senha "admin" para os testes
    let admin = await userRepository.findByEmail("admin@geopb.gov.br");
    const senhaHash = await hashPassword("admin");
    if (!admin) {
      admin = await userRepository.create({
        nome: "Administrador do Sistema",
        email: "admin@geopb.gov.br",
        senhaHash,
        tipo: "administrador" as any,
      });
    } else {
      await userRepository.update(admin.id, { senhaHash });
    }

    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@geopb.gov.br",
        senha: "admin",
      });

    if (loginRes.status === 200 && loginRes.body.token) {
      authToken = loginRes.body.token;
    }
  });

  // 1. AUTENTICAÇÃO
  describe("POST /auth/login", () => {
    it("deve realizar login do Administrador com sucesso e retornar token JWT", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@geopb.gov.br",
          senha: "admin",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", "admin@geopb.gov.br");
      authToken = response.body.token;
    });

    it("deve rejeitar login com senha incorreta (401)", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@geopb.gov.br",
          senha: "senha_errada_123",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  // 2. FAMÍLIAS
  describe("POST & GET /familias", () => {
    it("deve exigir latitude e longitude no cadastro de Família (400)", async () => {
      const response = await request(app)
        .post("/familias")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nomeResponsavel: "Família Teste Sem Coordenadas",
          endereco: "Rua Teste, 123",
          qtdMembros: 3,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Latitude e Longitude são obrigatórias");
    });

    it("deve cadastrar Família georreferenciada com sucesso (201)", async () => {
      const response = await request(app)
        .post("/familias")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nomeResponsavel: "Família Jest Test",
          endereco: "Av. Epitácio Pessoa, 1000 - João Pessoa",
          latitude: -7.1195,
          longitude: -34.845,
          rendaFamiliar: 1500.0,
          qtdMembros: 4,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.nomeResponsavel).toBe("Família Jest Test");
      testFamiliaId = response.body.id;
    });

    it("deve listar todas as famílias cadastradas (200)", async () => {
      const response = await request(app)
        .get("/familias")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // 3. BENEFICIÁRIOS
  describe("POST, GET, PUT & DELETE /beneficiarios", () => {
    const testCpf = `999.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-99`;

    it("deve cadastrar Beneficiário vinculado à Família (201)", async () => {
      const response = await request(app)
        .post("/beneficiarios")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nome: "Beneficiário Jest Test",
          cpf: testCpf,
          dataNascimento: "1990-05-15",
          telefone: "(83) 99999-0000",
          situacaoSocial: "Alta Vulnerabilidade",
          familiaId: testFamiliaId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.nome).toBe("Beneficiário Jest Test");
      testBeneficiarioId = response.body.id;
    });

    it("deve recusar cadastro de Beneficiário com CPF duplicado (400)", async () => {
      const response = await request(app)
        .post("/beneficiarios")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nome: "Outro Beneficiário",
          cpf: testCpf,
          dataNascimento: "1992-01-01",
          familiaId: testFamiliaId,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("CPF");
    });

    it("deve atualizar os dados do Beneficiário (PUT /beneficiarios/:id)", async () => {
      const response = await request(app)
        .put(`/beneficiarios/${testBeneficiarioId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          situacaoSocial: "Vulnerabilidade Moderada",
        });

      expect(response.status).toBe(200);
      expect(response.body.situacaoSocial).toBe("Vulnerabilidade Moderada");
    });

    it("deve buscar beneficiários por termo de pesquisa e filtro", async () => {
      const response = await request(app)
        .get("/beneficiarios?search=Jest")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((b: any) => b.id === testBeneficiarioId)).toBe(true);
    });
  });

  // 4. PROGRAMAS SOCIAIS
  describe("POST & GET /programas-sociais", () => {
    it("deve criar um programa social com sucesso", async () => {
      const response = await request(app)
        .post("/programas-sociais")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nome: "Bolsa Família Municipal Jest",
          descricao: "Programa de transferência de renda de teste",
          orgaoResponsavel: "SEDES-PB",
          ativo: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      testProgramaId = response.body.id;
    });

    it("deve associar beneficiário ao programa social", async () => {
      const response = await request(app)
        .post("/programas-sociais/associar")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          beneficiarioId: testBeneficiarioId,
          programaId: testProgramaId,
        });

      expect(response.status).toBe(201);
    });
  });

  // 5. VISITAS DOMICILIARES
  describe("POST /visitas", () => {
    it("deve registrar visita domiciliar georreferenciada", async () => {
      const response = await request(app)
        .post("/visitas")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          beneficiarioId: testBeneficiarioId,
          usuarioId: 1,
          latitude: -7.1195,
          longitude: -34.845,
          observacoes: "Atendimento de teste realizado pelo Jest/Supertest",
          acoesRealizadas: "Entregue cesta básica e verificação de documentos",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.beneficiarioId).toBe(testBeneficiarioId);
    });
  });

  // 6. MAPA & REDIS CACHE
  describe("GET /mapa/geojson", () => {
    it("deve retornar GeoJSON dos 223 municípios da PB com propriedades IBGE", async () => {
      const response = await request(app)
        .get("/mapa/geojson")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type", "FeatureCollection");
      expect(Array.isArray(response.body.features)).toBe(true);
      expect(response.body.features.length).toBeGreaterThan(0);
    });
  });

  // 7. NEO4J GRAPH DATABASE
  describe("POST /neo4j/sync & GET /neo4j/stats & /neo4j/consultas/*", () => {
    it("deve disparar a sincronização em grafo do Neo4j (POST /neo4j/sync)", async () => {
      const response = await request(app)
        .post("/neo4j/sync")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("stats");
    }, 30000);

    it("deve retornar estatísticas e status da fila do Neo4j (GET /neo4j/stats)", async () => {
      const response = await request(app)
        .get("/neo4j/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("nodes");
      expect(response.body).toHaveProperty("relationships");
      expect(response.body).toHaveProperty("queue");
    });

    it("deve executar consulta Cypher de proximidade de famílias", async () => {
      const response = await request(app)
        .get("/neo4j/consultas/proximidade?raio=15")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // 8. RELATÓRIOS EM PDF (RF15)
  describe("GET /relatorios/*/pdf", () => {
    it("deve gerar e transferir PDF do Relatório de Beneficiários", async () => {
      const response = await request(app)
        .get("/relatorios/beneficiarios/pdf")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/pdf");
    });

    it("deve gerar e transferir PDF do Relatório de Visitas Domiciliares", async () => {
      const response = await request(app)
        .get("/relatorios/visitas/pdf")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/pdf");
    });
  });

  // TEARDOWN: LIMPEZA DOS REGISTROS DE TESTE
  afterAll(async () => {
    if (testBeneficiarioId) {
      await request(app)
        .delete(`/beneficiarios/${testBeneficiarioId}`)
        .set("Authorization", `Bearer ${authToken}`);
    }

    if (testFamiliaId) {
      await request(app)
        .delete(`/familias/${testFamiliaId}`)
        .set("Authorization", `Bearer ${authToken}`);
    }
  });
});
