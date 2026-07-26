import { sequelize } from "../src/database/sequelize.ts";
import { Usuario, TipoUsuario } from "../src/models/index.ts";
import { hashPassword } from "../src/services/security.ts";

async function seed() {
  try {
    console.log("Conectando ao banco de dados...");
    await sequelize.authenticate();
    await sequelize.sync(); // Garante que a estrutura da tabela tb_usuario exista

    // Admin User
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
      console.log("✓ Usuário Administrador criado com sucesso! (admin@geopb.gov.br)");
    } else {
      console.log("i Usuário Administrador já existe (admin@geopb.gov.br)");
    }

    // Assistente Social User
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
      console.log("✓ Usuário Assistente Social criado com sucesso! (assistente@geopb.gov.br)");
    } else {
      console.log("i Usuário Assistente Social já existe (assistente@geopb.gov.br)");
    }

    console.log("Seed concluído!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  }
}

seed();
