import { z } from "zod";
import { validateCPF } from "../utils/cpfValidator.ts";

export const createBeneficiarioSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(3, "O nome deve ter no mínimo 3 caracteres."),
  cpf: z
    .string({ required_error: "CPF é obrigatório." })
    .transform((val) => val.replace(/\D/g, ""))
    .refine(validateCPF, { message: "CPF inválido." }),
  dataNascimento: z
    .string({ required_error: "Data de nascimento é obrigatória." }),
  telefone: z.string().optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
  situacaoSocial: z.string().optional().nullable(),
  familiaId: z.number({ required_error: "ID da família é obrigatório." }),
});
