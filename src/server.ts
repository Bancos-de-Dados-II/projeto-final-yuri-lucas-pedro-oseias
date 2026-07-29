import { app } from "./app.ts";
import { connectMongo } from "./database/mongodb.ts";
import { sequelize } from "./database/sequelize.ts";
import { Usuario, TipoUsuario } from "./models/index.ts";
import { hashPassword } from "./services/security.ts";

const PORT = process.env.PORT || 3333;

async function bootstrap() {
  try {
    console.log("Conectando e sincronizando banco relacional (Sequelize)...");
    await sequelize.authenticate();

    if (sequelize.getDialect() === "postgres") {
      try {
        await sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis;");
        console.log("✓ Extensão PostGIS ativada no PostgreSQL.");
      } catch (extErr) {
        console.warn("Aviso ao ativar extensão PostGIS:", (extErr as any)?.message || extErr);
      }
    }

    await sequelize.sync();
    console.log("✓ Tabelas sincronizadas no banco de dados.");

    // Criar usuários iniciais se não existirem
    const adminEmail = "admin@geopb.gov.br";
    const existingAdmin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const senhaHash = await hashPassword("admin123");
      await Usuario.create({
        nome: "Administrador do Sistema",
        email: adminEmail,
        senhaHash,
        tipo: TipoUsuario.ADMINISTRADOR,
      });
      console.log("✓ Usuário Admin criado (admin@geopb.gov.br)");
    }

    const assistenteEmail = "assistente@geopb.gov.br";
    const existingAssistente = await Usuario.findOne({ where: { email: assistenteEmail } });
    if (!existingAssistente) {
      const senhaHash = await hashPassword("user123");
      await Usuario.create({
        nome: "Maria Assistente Social",
        email: assistenteEmail,
        senhaHash,
        tipo: TipoUsuario.ASSISTENTE_SOCIAL,
      });
      console.log("✓ Usuário Assistente criado (assistente@geopb.gov.br)");
    }
  } catch (err) {
    console.error("Erro ao sincronizar banco relacional:", err);
  }

  // Inicializa conexões com bancos secundários (MongoDB)
  connectMongo()
    .then(() => console.log("MongoDB inicializado no startup"))
    .catch((err) => console.error("Falha ao inicializar MongoDB no startup:", err));

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

bootstrap();

