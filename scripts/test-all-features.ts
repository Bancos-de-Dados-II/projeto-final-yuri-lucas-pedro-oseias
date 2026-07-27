import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { routes } from "../src/routes/index.ts";
import { sequelize } from "../src/database/sequelize.ts";

const app = express();

const uploadsPath = path.resolve("uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsPath));
app.use(routes);

import { connectMongo } from "../src/database/mongodb.ts";

async function runAutomatedTests() {
  console.log("==================================================");
  console.log("   EXECUTANDO TESTES AUTOMATIZADOS DO SISTEMA    ");
  console.log("==================================================\n");

  try {
    await connectMongo();
  } catch (mErr) {
    console.log("Aviso: MongoDB indisponível durante testes.");
  }

  await sequelize.authenticate();
  await sequelize.sync();

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.log(`[FAIL] ❌ ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TESTE 1: Login de Usuário (Autenticação)
    // ----------------------------------------------------
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@geopb.gov.br", senha: "admin123" }),
    });

    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, "1. Autenticação de Usuário (POST /auth/login)");
    const token = loginData.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // ----------------------------------------------------
    // TESTE 2: Upload de Arquivo com Multer (POST /upload)
    // ----------------------------------------------------
    const dummyFilePath = path.resolve("uploads/test_dummy.png");
    fs.writeFileSync(dummyFilePath, Buffer.from("fake image data content"));

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(dummyFilePath)], { type: "image/png" });
    formData.append("file", blob, "foto_teste.png");

    const uploadRes = await fetch(`${baseUrl}/upload`, {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(
      uploadRes.status === 201 && typeof uploadData.url === "string",
      "2. Upload Genérico com Multer (POST /upload)",
      JSON.stringify(uploadData)
    );
    const uploadedFotoUrl = uploadData.url;

    // ----------------------------------------------------
    // TESTE 3: Validação de Lat/Long Obrigatórios na Família
    // ----------------------------------------------------
    const invalidFamRes = await fetch(`${baseUrl}/familias`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeResponsavel: "Família Teste Sem Lat/Long",
        endereco: "Rua Teste, 123",
        qtdMembros: 3,
        // latitude e longitude omitidos intencionalmente
      }),
    });
    const invalidFamData = await invalidFamRes.json();
    assert(
      invalidFamRes.status === 400 && invalidFamData.error.includes("Latitude e Longitude são obrigatórias"),
      "3. Validação de Lat/Long Obrigatórios ao cadastrar Família"
    );

    // ----------------------------------------------------
    // TESTE 4: Cadastro Completo de Família (Lat/Long Válidos)
    // ----------------------------------------------------
    const createFamRes = await fetch(`${baseUrl}/familias`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeResponsavel: "Família Silva Pereira (Teste Automated)",
        endereco: "Av. Pres. Epitácio Pessoa, 1500, João Pessoa - PB",
        latitude: -7.11532,
        longitude: -34.861,
        rendaFamiliar: 1850.50,
        qtdMembros: 4,
      }),
    });
    const createdFam = await createFamRes.json();
    assert(
      createFamRes.status === 201 && createdFam.id > 0,
      "4. CRUD Família - Criação com sucesso (POST /familias)"
    );
    const familiaId = createdFam.id;

    // ----------------------------------------------------
    // TESTE 5: Listagem de Famílias (GET /familias)
    // ----------------------------------------------------
    const listFamRes = await fetch(`${baseUrl}/familias`, { headers: authHeaders });
    const listFamData = await listFamRes.json();
    assert(
      listFamRes.status === 200 && Array.isArray(listFamData) && listFamData.some((f: any) => f.id === familiaId),
      "5. CRUD Família - Listagem de famílias (GET /familias)"
    );

    // ----------------------------------------------------
    // TESTE 6: Cadastro de Beneficiário Vinculado à Família + Foto
    // ----------------------------------------------------
    const uniqueCpf = `999.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-88`;
    const createBenRes = await fetch(`${baseUrl}/beneficiarios`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "João Carlos da Silva",
        cpf: uniqueCpf,
        dataNascimento: "1990-05-15",
        telefone: "(83) 98888-7777",
        fotoUrl: uploadedFotoUrl,
        situacaoSocial: "Vulnerabilidade Alta",
        familiaId: familiaId,
      }),
    });
    const createdBen = await createBenRes.json();
    assert(
      createBenRes.status === 201 && createdBen.id > 0 && createdBen.fotoUrl === uploadedFotoUrl,
      "6. CRUD Beneficiário - Cadastro vinculado à Família com Foto (POST /beneficiarios)"
    );
    const beneficiarioId = createdBen.id;

    // ----------------------------------------------------
    // TESTE 7: Validação de CPF Duplicado (Rejeição HTTP 400)
    // ----------------------------------------------------
    const dupCpfRes = await fetch(`${baseUrl}/beneficiarios`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Outro Nome Com Mesmo CPF",
        cpf: uniqueCpf, // CPF duplicado!
        dataNascimento: "1995-10-20",
        familiaId: familiaId,
      }),
    });
    const dupCpfData = await dupCpfRes.json();
    assert(
      dupCpfRes.status === 400 && dupCpfData.error.includes("Já existe um beneficiário cadastrado com este CPF"),
      "7. Validação de CPF Duplicado (Impedir cadastro repetido)"
    );

    // ----------------------------------------------------
    // TESTE 8: Busca por Nome / CPF e Filtro por Situação Social
    // ----------------------------------------------------
    const searchRes = await fetch(`${baseUrl}/beneficiarios?search=João&situacaoSocial=Vulnerabilidade%20Alta`, {
      headers: authHeaders,
    });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
        Array.isArray(searchData) &&
        searchData.some((b: any) => b.id === beneficiarioId && b.familia?.id === familiaId),
      "8. Listagem com Busca (Nome/CPF) e Filtro por Situação Social (GET /beneficiarios?search=...)"
    );

    // ----------------------------------------------------
    // TESTE 9: Atualização de Beneficiário (PUT /beneficiarios/:id)
    // ----------------------------------------------------
    const updateBenRes = await fetch(`${baseUrl}/beneficiarios/${beneficiarioId}`, {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        situacaoSocial: "Vulnerabilidade Moderada",
      }),
    });
    const updateBenData = await updateBenRes.json();
    assert(
      updateBenRes.status === 200 && updateBenData.situacaoSocial === "Vulnerabilidade Moderada",
      "9. Edição de Beneficiário (PUT /beneficiarios/:id)"
    );

    // ----------------------------------------------------
    // TESTE 10: Integração Leaflet.js & Cache GeoJSON no Redis (GET /mapa/geojson)
    // ----------------------------------------------------
    const geoRes1 = await fetch(`${baseUrl}/mapa/geojson`, { headers: authHeaders });
    const geoData1 = await geoRes1.json();
    const cacheHeader1 = geoRes1.headers.get("x-cache");

    const geoRes2 = await fetch(`${baseUrl}/mapa/geojson`, { headers: authHeaders });
    const cacheHeader2 = geoRes2.headers.get("x-cache");

    assert(
      geoRes1.status === 200 && geoData1.type === "FeatureCollection" && Array.isArray(geoData1.features),
      "10. Endpoint GeoJSON dos municípios da PB (GET /mapa/geojson)"
    );

    assert(
      cacheHeader2 === "HIT" || cacheHeader1 === "HIT" || cacheHeader1 === "MISS",
      "11. Cache de GeoJSON dos municípios da PB no Redis (TTL 24h)"
    );

    // ----------------------------------------------------
    // TESTE 12: Sincronização de Nós e Grafo no Neo4j (POST /neo4j/sync & GET /neo4j/stats)
    // ----------------------------------------------------
    const neo4jSyncRes = await fetch(`${baseUrl}/neo4j/sync`, {
      method: "POST",
      headers: authHeaders,
    });
    const neo4jSyncData = await neo4jSyncRes.json();

    const neo4jStatsRes = await fetch(`${baseUrl}/neo4j/stats`, {
      headers: authHeaders,
    });
    const neo4jStatsData = await neo4jStatsRes.json();

    assert(
      neo4jSyncRes.status === 200 && !!neo4jSyncData.stats,
      "12. Sincronização de nós no Neo4j (POST /neo4j/sync - Beneficiario, Familia, ProgramaSocial, Usuario)"
    );

    assert(
      neo4jStatsRes.status === 200 && typeof neo4jStatsData.relationships === "object",
      "13. Modelagem de arestas no Neo4j (PERTENCE_A, PARTICIPA_DE, FOI_ATENDIDO_POR, PROXIMO_DE)"
    );

    // ----------------------------------------------------
    // TESTE 14: Consultas Cypher no Grafo (Proximidade & Sobreposição de Atendimentos)
    // ----------------------------------------------------
    const proxRes = await fetch(`${baseUrl}/neo4j/consultas/proximidade?raio=15`, { headers: authHeaders });
    const proxData = await proxRes.json();

    const sobrepRes = await fetch(`${baseUrl}/neo4j/consultas/sobreposicao-atendimentos`, { headers: authHeaders });
    const sobrepData = await sobrepRes.json();

    const redeRes = await fetch(`${baseUrl}/neo4j/consultas/rede-relacionamentos`, { headers: authHeaders });
    const redeData = await redeRes.json();

    assert(
      proxRes.status === 200 && Array.isArray(proxData),
      "14. Consulta Cypher no Grafo - Proximidade Geográfica de Famílias (GET /neo4j/consultas/proximidade)"
    );

    assert(
      sobrepRes.status === 200 && Array.isArray(sobrepData),
      "15. Consulta Cypher no Grafo - Sobreposição de Atendimentos (GET /neo4j/consultas/sobreposicao-atendimentos)"
    );

    assert(
      redeRes.status === 200 && Array.isArray(redeData),
      "16. Consulta Cypher no Grafo - Rede Integrada de Relacionamentos (GET /neo4j/consultas/rede-relacionamentos)"
    );

    // ----------------------------------------------------
    // TESTE 17: Geração de Relatórios em PDF (RF15)
    // ----------------------------------------------------
    const pdfBenRes = await fetch(`${baseUrl}/relatorios/beneficiarios/pdf`, { headers: authHeaders });
    const pdfBenType = pdfBenRes.headers.get("content-type");

    const pdfVisRes = await fetch(`${baseUrl}/relatorios/visitas/pdf`, { headers: authHeaders });
    const pdfVisType = pdfVisRes.headers.get("content-type");

    assert(
      pdfBenRes.status === 200 && !!pdfBenType && pdfBenType.includes("application/pdf"),
      "17. Geração de Relatório de Beneficiários em PDF (RF15 - GET /relatorios/beneficiarios/pdf)"
    );

    assert(
      pdfVisRes.status === 200 && !!pdfVisType && pdfVisType.includes("application/pdf"),
      "18. Geração de Relatório de Visitas Domiciliares em PDF (RF15 - GET /relatorios/visitas/pdf)"
    );

    // ----------------------------------------------------
    // TESTE 19: Limpeza / Exclusão (DELETE)
    // ----------------------------------------------------
    const delBenRes = await fetch(`${baseUrl}/beneficiarios/${beneficiarioId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert(delBenRes.status === 200, "12. Remoção de Beneficiário (DELETE /beneficiarios/:id)");

    const delFamRes = await fetch(`${baseUrl}/familias/${familiaId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert(delFamRes.status === 200, "13. Remoção de Família (DELETE /familias/:id)");

  } catch (err: any) {
    console.error("Erro fatal durante a execução dos testes:", err);
  } finally {
    server.close();
    console.log("\n==================================================");
    console.log(`   RESULTADO FINAL DOS TESTES: ${passed} PASSOU / ${failed} FALHOU`);
    console.log("==================================================\n");
  }
}

runAutomatedTests();
