import swaggerUi from "swagger-ui-express";

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "GeoPB Comunidades API",
    version: "1.0.0",
    description: "API RESTful em Node.js com Express para o sistema de gestão social GeoPB Comunidades. Utiliza persistência poliglota com PostgreSQL (PostGIS), MongoDB, Redis e Neo4j.",
    contact: {
      name: "IFPB - Campus Cajazeiras"
    }
  },
  servers: [
    {
      url: "http://localhost:3333",
      description: "Servidor Local de Desenvolvimento"
    },
    {
      url: "https://api-projeto-final-banco-ii.onrender.com",
      description: "Servidor de Produção (Render)"
    }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health Check",
        description: "Verifica a integridade e saúde da API.",
        tags: ["Utilidades"],
        responses: {
          200: {
            description: "API operacional",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "GeoPB Comunidades API" },
                    timestamp: { type: "string", format: "date-time" },
                    env: { type: "string", example: "development" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Realizar Login",
        description: "Autentica um usuário e cria uma sessão ativa no Redis.",
        tags: ["Autenticação"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@geopb.gov.br" },
                  senha: { type: "string", format: "password", example: "admin123" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Autenticado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        nome: { type: "string" },
                        email: { type: "string" },
                        tipo: { type: "string" }
                      }
                    },
                    token: { type: "string", description: "JWT a ser usado nos requests subsequentes" }
                  }
                }
              }
            }
          },
          400: { description: "E-mail e senha são obrigatórios." },
          401: { description: "E-mail ou senha incorretos." },
          500: { description: "Erro interno no servidor." }
        }
      }
    },
    "/auth/logout": {
      post: {
        summary: "Realizar Logout",
        description: "Encerra a sessão ativa invalidando o token no Redis.",
        tags: ["Autenticação"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logout realizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Logout realizado com sucesso. Sessão invalidada no Redis." }
                  }
                }
              }
            }
          },
          400: { description: "Cabeçalho de autorização ausente ou malformado." },
          401: { description: "Token inválido ou sessão não encontrada no Redis." }
        }
      }
    },
    "/users": {
      post: {
        summary: "Cadastrar Usuário",
        description: "Cria um novo usuário (Assistente Social ou Administrador).",
        tags: ["Usuários"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "email", "senha", "tipo"],
                properties: {
                  nome: { type: "string", example: "João Assistente" },
                  email: { type: "string", format: "email", example: "joao@geopb.gov.br" },
                  senha: { type: "string", example: "senha123" },
                  tipo: { type: "string", enum: ["ADMINISTRADOR", "ASSISTENTE_SOCIAL"], example: "ASSISTENTE_SOCIAL" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Usuário criado com sucesso" },
          400: { description: "Dados inválidos ou e-mail já cadastrado." },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Usuários",
        description: "Retorna a lista de todos os administradores e assistentes cadastrados.",
        tags: ["Usuários"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      nome: { type: "string" },
                      email: { type: "string" },
                      tipo: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Não autorizado" }
        }
      }
    },
    "/familias": {
      post: {
        summary: "Cadastrar Família",
        description: "Cadastra uma família georreferenciada no PostgreSQL.",
        tags: ["Famílias"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nomeChefe", "latitude", "longitude", "endereco", "municipio"],
                properties: {
                  nomeChefe: { type: "string", example: "Família Silva" },
                  latitude: { type: "number", example: -6.888 },
                  longitude: { type: "number", example: -38.560 },
                  endereco: { type: "string", example: "Rua das Flores, 123" },
                  municipio: { type: "string", example: "Cajazeiras" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Família cadastrada com sucesso" },
          400: { description: "Campos obrigatórios ausentes." },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Famílias",
        description: "Retorna todas as famílias georreferenciadas.",
        tags: ["Famílias"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de famílias" },
          401: { description: "Não autorizado" }
        }
      }
    },
    "/familias/{id}": {
      delete: {
        summary: "Excluir Família",
        description: "Exclui uma família pelo ID.",
        tags: ["Famílias"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: { description: "Família excluída" },
          401: { description: "Não autorizado" },
          404: { description: "Família não encontrada" }
        }
      }
    },
    "/beneficiarios": {
      post: {
        summary: "Cadastrar Beneficiário",
        description: "Cadastra um beneficiário associado a uma família no PostgreSQL.",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "cpf", "nis", "dataNascimento", "parentesco", "renda", "familiaId"],
                properties: {
                  nome: { type: "string", example: "Lucas Silva" },
                  cpf: { type: "string", example: "11122233344" },
                  nis: { type: "string", example: "12345678901" },
                  dataNascimento: { type: "string", format: "date", example: "1995-10-20" },
                  parentesco: { type: "string", example: "Filho" },
                  renda: { type: "number", example: 500.00 },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Beneficiário cadastrado com sucesso" },
          400: { description: "CPF ou NIS já em uso." },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Beneficiários",
        description: "Lista todos os beneficiários cadastrados, com paginação e filtros opcionais.",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "nome", in: "query", schema: { type: "string" }, description: "Filtrar por nome" },
          { name: "cpf", in: "query", schema: { type: "string" }, description: "Filtrar por CPF" }
        ],
        responses: {
          200: { description: "Lista de beneficiários" },
          401: { description: "Não autorizado" }
        }
      }
    },
    "/beneficiarios/{id}": {
      put: {
        summary: "Atualizar Beneficiário",
        description: "Atualiza os dados de um beneficiário e grava um log de alteração no MongoDB.",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  renda: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Beneficiário atualizado" },
          401: { description: "Não autorizado" },
          404: { description: "Beneficiário não encontrado" }
        }
      },
      delete: {
        summary: "Excluir Beneficiário",
        description: "Exclui um beneficiário pelo ID.",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Beneficiário excluído" },
          401: { description: "Não autorizado" }
        }
      }
    },
    "/visitas": {
      post: {
        summary: "Registrar Visita",
        description: "Registra uma visita domiciliar (PostgreSQL, MongoDB e vinculação no Neo4j).",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["dataVisita", "observacoes", "situacao", "familiaId"],
                properties: {
                  dataVisita: { type: "string", format: "date-time", example: "2026-07-30T18:00:00Z" },
                  observacoes: { type: "string", example: "Visita periódica para checagem de cadastro." },
                  situacao: { type: "string", example: "Vulnerabilidade média" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Visita cadastrada" },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Visitas",
        description: "Retorna o histórico de todas as visitas domiciliares realizadas.",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de visitas" }
        }
      }
    },
    "/programas-sociais": {
      post: {
        summary: "Cadastrar Programa Social",
        description: "Cria um novo programa social no PostgreSQL.",
        tags: ["Programas Sociais"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "descricao", "beneficioMensal"],
                properties: {
                  nome: { type: "string", example: "Bolsa Família Municipal" },
                  descricao: { type: "string", example: "Auxílio financeiro para famílias vulneráveis." },
                  beneficioMensal: { type: "number", example: 250.00 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Programa social criado" }
        }
      }
    },
    "/programas-sociais/associar": {
      post: {
        summary: "Associar Beneficiário a Programa",
        description: "Associa um beneficiário a um programa social (cria relacionamento no Neo4j).",
        tags: ["Programas Sociais"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["beneficiarioId", "programaSocialId"],
                properties: {
                  beneficiarioId: { type: "string", format: "uuid" },
                  programaSocialId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Associação realizada com sucesso" }
        }
      }
    },
    "/agendamentos": {
      post: {
        summary: "Criar Agendamento",
        description: "Cria um agendamento de visita no PostgreSQL.",
        tags: ["Agendamentos"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["dataAgendada", "finalidade", "familiaId"],
                properties: {
                  dataAgendada: { type: "string", format: "date-time", example: "2026-08-05T09:00:00.000Z" },
                  finalidade: { type: "string", example: "Entrega de mantimentos e reavaliação socioeconômica" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Agendamento criado" }
        }
      }
    },
    "/mapa/geojson": {
      get: {
        summary: "GeoJSON dos Municípios",
        description: "Retorna limites espaciais dos municípios enriquecidos (cacheado via Redis).",
        tags: ["Mapa & Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "GeoJSON do estado",
            headers: {
              "X-Cache": {
                schema: { type: "string" },
                description: "HIT se veio do Redis, MISS se foi gerado/buscado em tempo real."
              }
            }
          }
        }
      }
    },
    "/relatorios/beneficiarios/pdf": {
      get: {
        summary: "Relatório de Beneficiários em PDF",
        description: "Gera e envia o relatório em PDF de beneficiários.",
        tags: ["Mapa & Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Arquivo PDF retornado",
            content: {
              "application/pdf": {}
            }
          }
        }
      }
    },
    "/relatorios/visitas/pdf": {
      get: {
        summary: "Relatório de Visitas em PDF",
        description: "Gera e envia o relatório em PDF das visitas domiciliares.",
        tags: ["Mapa & Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Arquivo PDF retornado",
            content: {
              "application/pdf": {}
            }
          }
        }
      }
    },
    "/upload": {
      post: {
        summary: "Upload de Arquivos",
        description: "Realiza o upload de fotos ou documentos (através do Multer).",
        tags: ["Utilidades"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Arquivo enviado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    filename: { type: "string" },
                    path: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/neo4j/sync": {
      post: {
        summary: "Sincronizar Neo4j",
        description: "Sincroniza todos os dados relacionais do PostgreSQL diretamente para o grafo do Neo4j.",
        tags: ["Operações Neo4j"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Sincronização concluída com sucesso" }
        }
      }
    },
    "/neo4j/stats": {
      get: {
        summary: "Obter Estatísticas do Grafo",
        description: "Retorna estatísticas de nós e relacionamentos do grafo Neo4j.",
        tags: ["Operações Neo4j"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Estatísticas do grafo" }
        }
      }
    },
    "/neo4j/consultas/proximidade": {
      get: {
        summary: "Consultar Proximidade",
        description: "Consulta Cypher buscando famílias vizinhas dentro de uma faixa.",
        tags: ["Operações Neo4j"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de vizinhos geográficos" }
        }
      }
    },
    "/neo4j/consultas/sobreposicao": {
      get: {
        summary: "Consultar Sobreposição de Atendimentos",
        description: "Busca beneficiários com visitas e atendimentos por múltiplos assistentes.",
        tags: ["Operações Neo4j"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de sobreposições de atendimento" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
};

export const swaggerSetup = (app: any) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("✓ Rota Swagger (/api-docs) configurada com sucesso.");
};
