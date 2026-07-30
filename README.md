[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/NZVyGR9C)

# 🗺️ GeoPB Comunidades

Sistema web de gestão social desenvolvido para auxiliar assistentes sociais no acompanhamento e organização de informações de famílias e indivíduos em situação de vulnerabilidade no estado da Paraíba.

A plataforma centraliza o cadastro de beneficiários e famílias, o registro georreferenciado de visitas domiciliares, o acompanhamento de programas sociais, o agendamento de atendimentos e a visualização de dados socioeconômicos em mapa interativo dos municípios paraibanos — substituindo o uso de registros em papel e planilhas descentralizadas, ainda comuns em muitos municípios de pequeno e médio porte do estado.

O projeto é composto por uma aplicação web (HTML, CSS e JavaScript) e uma API RESTful em Node.js com Express, adotando uma arquitetura de **persistência poliglota**:

- **PostgreSQL** — banco relacional principal, fonte de verdade dos dados estruturados (usuários, beneficiários, famílias, visitas, programas sociais e agendamentos)
- **MongoDB** — armazenamento de logs de atividade e histórico de alterações dos cadastros, com esquema flexível
- **Redis** — cache em memória para sessões JWT (com TTL) e para os dados de GeoJSON dos municípios
- **Neo4j** — modelagem em grafo da rede de vulnerabilidade social, permitindo consultas de proximidade geográfica e sobreposição de atendimentos

A autenticação é feita via JWT, e recursos de geolocalização permitem registrar e visualizar a posição de cada família e visita, enquanto o módulo de upload possibilita anexar fotos e documentos aos registros dos beneficiários.

---

🚀 **Versão em Produção:** A API está hospedada e ativa no endereço: [https://api-projeto-final-banco-ii.onrender.com](https://api-projeto-final-banco-ii.onrender.com) (Endpoint de health check: `/health`).

📖 **Documentação da API (Swagger):** Disponível de forma interativa para teste de rotas nos seguintes endereços:
* Desenvolvimento Local: [http://localhost:3333/api-docs](http://localhost:3333/api-docs)
* Produção: [https://api-projeto-final-banco-ii.onrender.com/api-docs](https://api-projeto-final-banco-ii.onrender.com/api-docs)

---

*Desenvolvido como projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas do IFPB — Campus Cajazeiras.*

---

## 🗄️ Arquitetura Poliglota (Bancos de Dados)

### 1. 🐘 PostgreSQL + PostGIS (Banco Relacional)
* **Motivo de Uso:** Dados altamente estruturados e relacionais que exigem forte consistência transacional (ACID). A extensão **PostGIS** é utilizada para realizar indexação espacial e consultas geográficas nativas.
* **Onde é aplicado:**
  * Cadastro de Usuários (Administradores e Assistentes Sociais).
  * Cadastro estruturado de Famílias (coordenadas geográficas lat/long) e seus Beneficiários.
  * Agendamentos de visitas e controle de Programas Sociais.

### 2. 🍃 MongoDB (Orientado a Documentos)
* **Motivo de Uso:** Ideal para armazenar estruturas de dados semi-estruturadas, logs históricos e auditoria de forma escalável e com alta velocidade de escrita (schema-flexível).
* **Onde é aplicado:**
  * **Logs de auditoria e alterações** de dados de beneficiários (`beneficiarios_logs`).
  * **Logs detalhados de visitas** domiciliares realizadas (`visitas_logs`), permitindo anexar campos dinâmicos variáveis e metadados de arquivos/fotos sem alterar o esquema fixo do banco relacional.

### 3. 🕸️ Neo4j (Orientado a Grafos)
* **Motivo de Uso:** Otimizado para mapear e interagir com conexões complexas e redes de relacionamentos. Consultas do tipo "amigos de amigos" ou de proximidade de nós (usando cypher) rodam em milissegundos comparadas a JOINs pesados em bancos relacionais.
* **Onde é aplicado:**
  * **Proximidade geográfica de famílias** (`(Familia)-[:PROXIMO_DE]->(Familia)`).
  * **Sobreposição de atendimentos** de assistentes a beneficiários (`(Beneficiario)-[:FOI_ATENDIDO_POR]->(Usuario)`).
  * Mapeamento de redes de vulnerabilidade e participação em múltiplos programas sociais (`(Beneficiario)-[:PARTICIPA_DE]->(ProgramaSocial)`).

### 4. ⚡ Redis (Chave-Valor em Memória)
* **Motivo de Uso:** Banco de dados de ultra-rápida resposta baseado em memória RAM, ideal para caching temporário de dados pesados e controle de estado de sessões efêmeras.
* **Onde é aplicado:**
  * **Cache de dados espaciais** pesados, como o GeoJSON dos limites territoriais dos 223 municípios da Paraíba (evitando requisições repetidas para a malha do IBGE).
  * **Armazenamento de Sessões Ativas** (`session:<token>`), controlando o ciclo de vida dos tokens JWT do usuário com expiração automática (TTL) de 24 horas.

---

## 🛠️ Ferramentas de Observabilidade de Dados

O projeto conta com ferramentas visuais configuradas no ambiente Docker para inspecionar os bancos de dados localmente:

* **Redis:** **RedisInsight** disponível em [http://localhost:5540](http://localhost:5540). Permite visualizar as sessões de login ativas e as chaves de cache em tempo real.
* **Neo4j:** **Neo4j Browser** disponível em [http://localhost:7474](http://localhost:7474). Interface nativa para rodar queries Cypher e ver o grafo de conexões de forma visual.
* **MongoDB:** Compatível com ferramentas cliente locais, como a extensão **MongoDB for VS Code** ou **MongoDB Compass** conectando em `mongodb://admin:admin@localhost:27017/?authSource=admin`.

---

## 🛣️ Rotas da API

A API expõe os seguintes endpoints mapeados (todos exceto `/auth` e `/health` requerem cabeçalho `Authorization: Bearer <token>`):

### Autenticação & Usuários
* `POST /auth/login` — Autenticação do usuário (retorna JWT e inicia sessão no Redis)
* `POST /auth/logout` — Encerra a sessão atual e invalida o token no Redis
* `POST /users` — Cadastro de novos usuários assistentes/admins
* `GET /users` — Listagem dos usuários do sistema

### Famílias & Beneficiários
* `POST /familias` — Cadastro de famílias georreferenciadas (dados espaciais no Postgres)
* `GET /familias` — Listagem de famílias cadastradas
* `DELETE /familias/:id` — Exclusão de famílias
* `POST /beneficiarios` — Cadastro de beneficiários vinculados a famílias
* `GET /beneficiarios` — Listagem e filtro/pesquisa de beneficiários
* `PUT /beneficiarios/:id` — Atualização de cadastro de beneficiários (gera log no MongoDB)
* `DELETE /beneficiarios/:id` — Exclusão de beneficiário

### Visitas & Programas
* `POST /visitas` — Cadastro de visitas georreferenciadas (cria log no MongoDB e vinculação no Neo4j)
* `GET /visitas` — Histórico de visitas domiciliares
* `POST /programas-sociais` — Cadastro de programas sociais municipais
* `POST /programas-sociais/associar` — Associa um beneficiário a um programa social (cria relacionamento no Neo4j)

### Agendamentos, Mapa & Relatórios
* `POST /agendamentos` — Cria agendamento de atendimento
* `GET /mapa/geojson` — Retorna limites espaciais dos municípios enriquecidos (cacheado via Redis)
* `GET /relatorios/beneficiarios/pdf` — Geração do relatório em PDF de beneficiários (nativa via PDFKit)
* `GET /relatorios/visitas/pdf` — Geração do relatório de visitas domiciliares

### Operações Neo4j (Grafo)
* `POST /neo4j/sync` — Sincroniza todos os dados relacionais do Postgres diretamente para o Neo4j
* `GET /neo4j/stats` — Retorna estatísticas de nós e relacionamentos do grafo
* `GET /neo4j/consultas/proximidade` — Consulta Cypher buscando famílias vizinhas num raio de distância
* `GET /neo4j/consultas/sobreposicao` — Busca beneficiários com visitas e atendimentos por múltiplos assistentes

### Utilidades
* `GET /health` — Health check básico da API
* `POST /upload` — Upload de arquivos de foto e documentos anexos (usando Multer)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (v18+)
* Docker e Docker Compose

### Configuração das Variáveis de Ambiente (`.env`)

Antes de rodar o projeto, crie um arquivo `.env` na raiz copiando as variáveis do `.env.example`. Aqui está o propósito de cada variável configurada:

| Variável | Descrição / Valor Padrão | Finalidade |
|----------|--------------------------|------------|
| `PORT` | `3333` | Porta onde o servidor Node.js/Express será executado. |
| `NODE_ENV` | `development` | Define o ambiente (`development` localmente para evitar SSL no PostgreSQL, `production` em nuvem). |
| `JWT_SECRET` | *(Chave Secreta)* | Chave de assinatura e geração dos tokens JWT. |
| `JWT_EXPIRES_IN` | `1d` | Tempo de expiração do token gerado (ex: 1 dia). |
| `DATABASE_URL` | `postgresql://...:5432/app` | String de conexão com o PostgreSQL (PostGIS) utilizado pelo Prisma/Sequelize. |
| `MONGO_URI` | `mongodb://...:27017/geopb` | URI de conexão com o MongoDB (usado para salvar os logs de atividade). |
| `REDIS_URL` | `redis://localhost:6379` | Endereço de conexão com a instância de cache/sessões do Redis. |
| `NEO4J_URI` | `bolt://localhost:7687` | URI do protocolo Bolt para conectar com o Neo4j (Grafos). |
| `NEO4J_USER` | `neo4j` | Usuário de autenticação do Neo4j. |
| `NEO4J_PASSWORD` | `password` | Senha de autenticação definida para o Neo4j. |

### Passo a Passo

1. **Clone o repositório e acesse a pasta:**
   ```bash
   cd projeto-final-yuri-lucas-pedro-oseias
   ```

2. **Crie e configure o arquivo `.env`:**
   Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

3. **Suba as imagens dos bancos de dados:**
   ```bash
   docker compose up -d
   ```

4. **Instale as dependências:**
   ```bash
   npm install
   ```

5. **Prepare as tabelas do PostgreSQL via Prisma Client:**
   ```bash
   npx prisma db push
   ```

6. **Execute o script de seed para popular os bancos:**
   ```bash
   npx tsx -r dotenv/config scripts/seed.ts
   ```

7. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

A API estará disponível na porta `3333`, e o frontend pode ser acessado direto em [http://localhost:3333](http://localhost:3333).

### 🔑 Credenciais Padrão de Acesso

Após rodar o script de seed, você poderá fazer login no sistema usando os seguintes usuários pré-configurados:

| Usuário | E-mail | Senha | Função |
|---------|--------|-------|--------|
| **Administrador** | `admin@geopb.gov.br` | `admin123` | Acesso total ao sistema, relatórios e grafos |
| **Assistente Social** | `assistente@geopb.gov.br` | `user123` | Cadastro de famílias, beneficiários e visitas |

---

## 🧪 Executando os Testes

O projeto conta com uma suíte de testes de integração ponta a ponta (E2E) rodando com Jest:

```bash
npm test
```
