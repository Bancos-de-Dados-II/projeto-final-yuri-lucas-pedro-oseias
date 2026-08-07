import swaggerUi from "swagger-ui-express";

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "GeoPB Comunidades API",
    version: "1.0.0",
    description: "API RESTful em Node.js com Express para o sistema de gestão social GeoPB Comunidades. Utiliza persistência poliglota com PostgreSQL (PostGIS), MongoDB, Redis e Neo4j (Grafos).",
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
        description: "Autentica um usuário, emite o token JWT e define o cookie HttpOnly.",
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
                    }
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
        description: "Encerra a sessão ativa invalidando o token no Redis e removendo o cookie HttpOnly.",
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
          400: { description: "Token ausente." },
          401: { description: "Sessão inválida ou não autenticada." }
        }
      }
    },
    "/auth/me": {
      get: {
        summary: "Dados do Usuário Logado",
        description: "Retorna os dados do usuário autenticado a partir do token contido no cookie HttpOnly.",
        tags: ["Autenticação"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dados do usuário logado",
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
                        tipo: { type: "string" },
                        fotoUrl: { type: "string", nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Não autenticado." }
        }
      }
    },
    "/users": {
      post: {
        summary: "Cadastrar Usuário",
        description: "Cria um novo usuário (Assistente Social ou Administrador). Exclusivo para administradores.",
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
                  tipo: { type: "string", enum: ["administrador", "assistente_social"], example: "assistente_social" },
                  fotoUrl: { type: "string", example: "data:image/png;base64,..." }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Usuário criado com sucesso" },
          400: { description: "Dados inválidos ou e-mail já cadastrado." },
          401: { description: "Não autorizado" },
          403: { description: "Acesso permitido apenas para administradores" }
        }
      },
      get: {
        summary: "Listar Usuários",
        description: "Retorna a lista de todos os usuários cadastrados. Exclusivo para administradores.",
        tags: ["Usuários"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de usuários" },
          401: { description: "Não autorizado" },
          403: { description: "Acesso permitido apenas para administradores" }
        }
      }
    },
    "/users/{id}": {
      get: {
        summary: "Buscar Usuário por ID",
        description: "Retorna as informações detalhadas de um usuário por ID. Exclusivo para administradores.",
        tags: ["Usuários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Dados do usuário" },
          404: { description: "Usuário não encontrado" }
        }
      },
      put: {
        summary: "Atualizar Usuário",
        description: "Atualiza os dados de um usuário pelo ID. Exclusivo para administradores.",
        tags: ["Usuários"],
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
                  email: { type: "string", format: "email" },
                  senha: { type: "string" },
                  tipo: { type: "string", enum: ["administrador", "assistente_social"] },
                  fotoUrl: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Usuário atualizado" },
          404: { description: "Usuário não encontrado" }
        }
      },
      delete: {
        summary: "Excluir Usuário",
        description: "Remove um usuário do sistema pelo ID. Exclusivo para administradores.",
        tags: ["Usuários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Usuário removido com sucesso" },
          404: { description: "Usuário não encontrado" }
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
      get: {
        summary: "Buscar Família por ID",
        description: "Retorna os detalhes de uma família por ID.",
        tags: ["Famílias"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Detalhes da família" },
          404: { description: "Família não encontrada" }
        }
      },
      put: {
        summary: "Atualizar Família",
        description: "Atualiza os dados geográficos e cadastrais de uma família.",
        tags: ["Famílias"],
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
                  nomeChefe: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  endereco: { type: "string" },
                  municipio: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Família atualizada com sucesso" },
          404: { description: "Família não encontrada" }
        }
      },
      delete: {
        summary: "Excluir Família",
        description: "Exclui uma família pelo ID.",
        tags: ["Famílias"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
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
                required: ["nome", "cpf", "dataNascimento", "familiaId"],
                properties: {
                  nome: { type: "string", example: "Lucas Silva" },
                  cpf: { type: "string", example: "11122233344" },
                  dataNascimento: { type: "string", format: "date", example: "1995-10-20" },
                  telefone: { type: "string", example: "83999998888" },
                  fotoUrl: { type: "string", example: "data:image/png;base64,..." },
                  situacaoSocial: { type: "string", example: "Vulnerabilidade média" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Beneficiário cadastrado com sucesso" },
          400: { description: "CPF já em uso ou dados inválidos." },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Beneficiários",
        description: "Lista todos os beneficiários cadastrados com filtros opcionais por nome ou CPF.",
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
      get: {
        summary: "Buscar Beneficiário por ID",
        description: "Retorna os dados detalhados de um beneficiário.",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Detalhes do beneficiário" },
          404: { description: "Beneficiário não encontrado" }
        }
      },
      put: {
        summary: "Atualizar Beneficiário",
        description: "Atualiza os dados de um beneficiário e gera registro de alteração de histórico no MongoDB.",
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
                  cpf: { type: "string" },
                  dataNascimento: { type: "string", format: "date" },
                  telefone: { type: "string" },
                  fotoUrl: { type: "string" },
                  situacaoSocial: { type: "string" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Beneficiário atualizado com sucesso" },
          401: { description: "Não autorizado" },
          404: { description: "Beneficiário não encontrado" }
        }
      },
      delete: {
        summary: "Excluir Beneficiário",
        description: "Exclui um beneficiário pelo ID (soft delete).",
        tags: ["Beneficiários"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Beneficiário excluído" },
          401: { description: "Não autorizado" },
          404: { description: "Beneficiário não encontrado" }
        }
      }
    },
    "/visitas": {
      post: {
        summary: "Registrar Visita",
        description: "Registra uma visita domiciliar associada a uma família (grava no PostgreSQL e log no MongoDB).",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["dataVisita", "observacoes", "familiaId"],
                properties: {
                  dataVisita: { type: "string", format: "date-time", example: "2026-07-30T18:00:00Z" },
                  observacoes: { type: "string", example: "Visita periódica para checagem de cadastro." },
                  situacao: { type: "string", example: "Vulnerabilidade alta" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Visita cadastrada com sucesso" },
          401: { description: "Não autorizado" }
        }
      },
      get: {
        summary: "Listar Visitas",
        description: "Retorna o histórico de todas as visitas domiciliares realizadas.",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de visitas" },
          401: { description: "Não autorizado" }
        }
      }
    },
    "/visitas/{id}": {
      get: {
        summary: "Buscar Visita por ID",
        description: "Retorna os dados detalhados de uma visita registrada.",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Detalhes da visita" },
          404: { description: "Visita não encontrada" }
        }
      },
      put: {
        summary: "Atualizar Visita",
        description: "Atualiza os dados de uma visita e salva o histórico no MongoDB.",
        tags: ["Visitas"],
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
                  dataVisita: { type: "string", format: "date-time" },
                  observacoes: { type: "string" },
                  situacao: { type: "string" },
                  familiaId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Visita atualizada com sucesso" },
          404: { description: "Visita não encontrada" }
        }
      },
      delete: {
        summary: "Excluir Visita",
        description: "Exclui um registro de visita pelo ID.",
        tags: ["Visitas"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Visita excluída com sucesso" },
          404: { description: "Visita não encontrada" }
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
                required: ["nome", "descricao"],
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
      },
      get: {
        summary: "Listar Programas Sociais",
        description: "Retorna a lista de todos os programas sociais cadastrados.",
        tags: ["Programas Sociais"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de programas sociais" }
        }
      }
    },
    "/programas-sociais/{id}": {
      get: {
        summary: "Buscar Programa Social por ID",
        description: "Retorna os detalhes de um programa social por ID.",
        tags: ["Programas Sociais"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Detalhes do programa social" },
          404: { description: "Programa social não encontrado" }
        }
      },
      put: {
        summary: "Atualizar Programa Social",
        description: "Atualiza um programa social existente.",
        tags: ["Programas Sociais"],
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
                  descricao: { type: "string" },
                  beneficioMensal: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Programa social atualizado com sucesso" },
          404: { description: "Programa social não encontrado" }
        }
      },
      delete: {
        summary: "Excluir Programa Social",
        description: "Exclui um programa social pelo ID.",
        tags: ["Programas Sociais"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Programa social excluído com sucesso" },
          404: { description: "Programa social não encontrado" }
        }
      }
    },
    "/programas-sociais/associar": {
      post: {
        summary: "Associar Beneficiário a Programa",
        description: "Associa um beneficiário a um programa social.",
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
    "/programas-sociais/desassociar": {
      post: {
        summary: "Desassociar Beneficiário de Programa",
        description: "Remove a associação de um beneficiário a um programa social.",
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
          200: { description: "Desassociação realizada com sucesso" }
        }
      }
    },
    "/agendamentos": {
      get: {
        summary: "Listar Agendamentos",
        description: "Retorna todos os agendamentos registrados no PostgreSQL.",
        tags: ["Agendamentos"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de agendamentos" }
        }
      },
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
                required: ["dataAgendamento", "hora", "beneficiarioId"],
                properties: {
                  dataAgendamento: { type: "string", format: "date", example: "2026-08-10" },
                  hora: { type: "string", example: "14:00" },
                  beneficiarioId: { type: "string", format: "uuid" },
                  observacoes: { type: "string", example: "Reavaliação socioeconômica" },
                  status: { type: "string", enum: ["pendente", "confirmado", "realizado", "cancelado"], example: "pendente" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Agendamento criado com sucesso" },
          400: { description: "Dados inválidos ou conflito de horário" }
        }
      }
    },
    "/agendamentos/{id}": {
      get: {
        summary: "Buscar Agendamento por ID",
        description: "Retorna as informações de um agendamento por ID.",
        tags: ["Agendamentos"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Detalhes do agendamento" },
          404: { description: "Agendamento não encontrado" }
        }
      },
      put: {
        summary: "Atualizar Agendamento",
        description: "Atualiza status, horário ou informações de um agendamento.",
        tags: ["Agendamentos"],
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
                  dataAgendamento: { type: "string", format: "date" },
                  hora: { type: "string" },
                  observacoes: { type: "string" },
                  status: { type: "string", enum: ["pendente", "confirmado", "realizado", "cancelado"] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Agendamento atualizado com sucesso" },
          404: { description: "Agendamento não encontrado" }
        }
      },
      delete: {
        summary: "Excluir Agendamento",
        description: "Exclui um agendamento pelo ID.",
        tags: ["Agendamentos"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: { description: "Agendamento excluído com sucesso" },
          404: { description: "Agendamento não encontrado" }
        }
      }
    },
    "/mapa/geojson": {
      get: {
        summary: "GeoJSON dos Municípios",
        description: "Retorna limites espaciais dos municípios da PB (com cache no Redis TTL 24h).",
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
    "/mapa/cache": {
      delete: {
        summary: "Invalidar Cache do Mapa",
        description: "Invalida a chave de cache do GeoJSON dos municípios no Redis.",
        tags: ["Mapa & Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Cache de mapas invalidado com sucesso." }
        }
      }
    },
    "/relatorios/beneficiarios/pdf": {
      get: {
        summary: "Relatório Geral de Beneficiários em PDF",
        description: "Gera e envia o relatório consolidado em PDF de beneficiários.",
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
        summary: "Relatório Geral de Visitas em PDF",
        description: "Gera e envia o relatório consolidado em PDF das visitas domiciliares.",
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
    "/relatorios/visita/{id}/pdf": {
      get: {
        summary: "Relatório de Visita Individual em PDF",
        description: "Gera e envia o relatório em PDF referente a uma visita específica por ID.",
        tags: ["Mapa & Relatórios"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Arquivo PDF retornado",
            content: {
              "application/pdf": {}
            }
          },
          404: { description: "Visita não encontrada." }
        }
      }
    },
    "/upload": {
      post: {
        summary: "Upload de Arquivos / Fotos",
        description: "Processa o upload de uma foto ou documento em memória (Multer) e converte para Data URL em Base64.",
        tags: ["Utilidades"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Arquivo JPG, PNG ou PDF de até 5MB"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Arquivo processado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", description: "Data URL em Base64 pronta para persistência no banco de dados." },
                    filename: { type: "string" },
                    originalname: { type: "string" },
                    mimetype: { type: "string" },
                    size: { type: "number" }
                  }
                }
              }
            }
          },
          400: { description: "Nenhum arquivo enviado, tipo não suportado ou excede 5MB." }
        }
      }
    },
    "/neo4j/sync": {
      post: {
        summary: "Sincronizar Banco relacional com Neo4j",
        description: "Executa a sincronização completa de todos os nós (Usuario, Familia, Beneficiario, ProgramaSocial) e relacionamentos no banco de grafos Neo4j.",
        tags: ["Neo4j / Grafos"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Sincronização realizada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    stats: { type: "object" },
                    queue: { type: "object" }
                  }
                }
              }
            }
          },
          401: { description: "Não autorizado." },
          500: { description: "Erro ao sincronizar com o Neo4j." }
        }
      }
    },
    "/neo4j/stats": {
      get: {
        summary: "Estatísticas do Grafo Neo4j",
        description: "Retorna a contagem de nós, relacionamentos e estatísticas da fila assíncrona pós-escrita no Neo4j.",
        tags: ["Neo4j / Grafos"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Estatísticas retornadas com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nodes: { type: "object" },
                    relationships: { type: "object" },
                    queue: { type: "object" }
                  }
                }
              }
            }
          },
          401: { description: "Não autorizado." },
          500: { description: "Erro ao consultar o Neo4j." }
        }
      }
    },
    "/neo4j/consultas/proximidade": {
      get: {
        summary: "Consulta Cypher: Proximidade Espacial de Famílias",
        description: "Identifica pares de famílias que residem próximas umas das outras dentro de um raio configurável (em KM) utilizando o relacionamento PROXIMO_DE.",
        tags: ["Neo4j / Grafos"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "raio",
            in: "query",
            required: false,
            description: "Raio máximo em quilômetros (padrão: 10.0)",
            schema: { type: "number", example: 10.0 }
          }
        ],
        responses: {
          200: {
            description: "Lista de famílias com proximidade espacial",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "object" }
                }
              }
            }
          },
          401: { description: "Não autorizado." },
          500: { description: "Erro interno ao executar consulta Cypher no Neo4j." }
        }
      }
    },
    "/neo4j/consultas/sobreposicao-atendimentos": {
      get: {
        summary: "Consulta Cypher: Sobreposição de Atendimentos",
        description: "Localiza beneficiários que receberam atendimento de múltiplos usuários/assistentes sociais (relacionamento FOI_ATENDIDO_POR).",
        tags: ["Neo4j / Grafos"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de sobreposição de atendimentos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "object" }
                }
              }
            }
          },
          401: { description: "Não autorizado." },
          500: { description: "Erro interno ao executar consulta Cypher no Neo4j." }
        }
      }
    },
    "/neo4j/consultas/rede-relacionamentos": {
      get: {
        summary: "Consulta Cypher: Rede Integrada de Relacionamentos",
        description: "Retorna a topologia completa da rede de relacionamentos (Usuario, Beneficiario, Familia, ProgramaSocial) do grafo.",
        tags: ["Neo4j / Grafos"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Rede de relacionamentos do grafo",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "object" }
                }
              }
            }
          },
          401: { description: "Não autorizado." },
          500: { description: "Erro interno ao executar consulta Cypher no Neo4j." }
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
};
