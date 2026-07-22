-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('administrador', 'assistente_social');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('pendente', 'confirmado', 'realizado', 'cancelado');

-- CreateTable
CREATE TABLE "tb_usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "foto_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_familia" (
    "id" SERIAL NOT NULL,
    "nome_responsavel" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "renda_familiar" DECIMAL(10,2),
    "qtd_membros" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_beneficiario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "telefone" TEXT,
    "foto_url" TEXT,
    "situacao_social" TEXT,
    "familia_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_beneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_visita" (
    "id" SERIAL NOT NULL,
    "data_visita" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "acoes_realizadas" TEXT,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "beneficiario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_visita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_programa_social" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "orgao_responsavel" TEXT,
    "data_inicio" DATE,
    "data_fim" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tb_programa_social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_agendamento" (
    "id" SERIAL NOT NULL,
    "data_agendamento" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "beneficiario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_beneficiario_programa" (
    "beneficiario_id" INTEGER NOT NULL,
    "programa_id" INTEGER NOT NULL,
    "data_inclusao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_beneficiario_programa_pkey" PRIMARY KEY ("beneficiario_id","programa_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_usuario_email_key" ON "tb_usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tb_beneficiario_cpf_key" ON "tb_beneficiario"("cpf");

-- AddForeignKey
ALTER TABLE "tb_beneficiario" ADD CONSTRAINT "tb_beneficiario_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "tb_familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_visita" ADD CONSTRAINT "tb_visita_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "tb_beneficiario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_visita" ADD CONSTRAINT "tb_visita_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "tb_usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_agendamento" ADD CONSTRAINT "tb_agendamento_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "tb_beneficiario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_agendamento" ADD CONSTRAINT "tb_agendamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "tb_usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_beneficiario_programa" ADD CONSTRAINT "tb_beneficiario_programa_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "tb_beneficiario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_beneficiario_programa" ADD CONSTRAINT "tb_beneficiario_programa_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "tb_programa_social"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
