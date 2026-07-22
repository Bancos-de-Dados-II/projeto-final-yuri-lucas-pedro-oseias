import { Usuario, TipoUsuario } from "./Usuario.ts";
import { Familia } from "./Familia.ts";
import { Beneficiario } from "./Beneficiario.ts";
import { Visita } from "./Visita.ts";
import { ProgramaSocial } from "./ProgramaSocial.ts";
import { Agendamento, StatusAgendamento } from "./Agendamento.ts";
import { BeneficiarioPrograma } from "./BeneficiarioPrograma.ts";

// Relacionamento Familia <-> Beneficiario (1:N)
Familia.hasMany(Beneficiario, { foreignKey: "familiaId", as: "beneficiarios" });
Beneficiario.belongsTo(Familia, { foreignKey: "familiaId", as: "familia" });

// Relacionamento Usuario <-> Visita (1:N)
Usuario.hasMany(Visita, { foreignKey: "usuarioId", as: "visitas" });
Visita.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Relacionamento Beneficiario <-> Visita (1:N)
Beneficiario.hasMany(Visita, { foreignKey: "beneficiarioId", as: "visitas" });
Visita.belongsTo(Beneficiario, { foreignKey: "beneficiarioId", as: "beneficiario" });

// Relacionamento Usuario <-> Agendamento (1:N)
Usuario.hasMany(Agendamento, { foreignKey: "usuarioId", as: "agendamentos" });
Agendamento.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Relacionamento Beneficiario <-> Agendamento (1:N)
Beneficiario.hasMany(Agendamento, { foreignKey: "beneficiarioId", as: "agendamentos" });
Agendamento.belongsTo(Beneficiario, { foreignKey: "beneficiarioId", as: "beneficiario" });

// Relacionamento Beneficiario <-> ProgramaSocial (N:M)
Beneficiario.belongsToMany(ProgramaSocial, {
  through: BeneficiarioPrograma,
  foreignKey: "beneficiarioId",
  otherKey: "programaId",
  as: "programas",
});
ProgramaSocial.belongsToMany(Beneficiario, {
  through: BeneficiarioPrograma,
  foreignKey: "programaId",
  otherKey: "beneficiarioId",
  as: "beneficiarios",
});

export {
  Usuario,
  TipoUsuario,
  Familia,
  Beneficiario,
  Visita,
  ProgramaSocial,
  Agendamento,
  StatusAgendamento,
  BeneficiarioPrograma,
};
