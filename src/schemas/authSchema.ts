import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório." })
    .email("Formato de e-mail inválido."),
  senha: z
    .string({ required_error: "Senha é obrigatória." })
    .min(1, "A senha não pode estar em branco."),
});
