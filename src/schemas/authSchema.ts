import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "E-mail é obrigatório." })
    .email("Formato de e-mail inválido."),
  senha: z
    .string({ message: "Senha é obrigatória." })
    .min(1, "A senha não pode estar em branco."),
});
