import { z } from "zod";

export const createUserSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório." })
    .min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("Formato de e-mail inválido."),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(6, "A senha deve ter no mínimo 6 caracteres."),
  tipo: z
    .enum(["administrador", "assistente_social"], {
      errorMap: () => ({ message: "O tipo de usuário deve ser administrador ou assistente_social." }),
    })
    .default("assistente_social"),
  fotoUrl: z.string().optional().nullable(),
});
