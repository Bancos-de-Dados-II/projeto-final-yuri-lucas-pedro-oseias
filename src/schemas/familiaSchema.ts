import { z } from "zod";

const numericPreprocess = (val: any) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? val : parsed;
};

export const createFamiliaSchema = z.object({
  nomeResponsavel: z
    .string({ required_error: "Campo 'nomeResponsavel' é obrigatório." })
    .min(3, "O nome do responsável deve ter no mínimo 3 caracteres."),
  endereco: z
    .string({ required_error: "Campo 'endereco' é obrigatório." }),
  latitude: z.preprocess(
    numericPreprocess,
    z
      .number({ required_error: "Latitude é obrigatória e deve ser numérica." })
      .min(-90, "Latitude deve ser no mínimo -90.")
      .max(90, "Latitude deve ser no máximo 90.")
  ),
  longitude: z.preprocess(
    numericPreprocess,
    z
      .number({ required_error: "Longitude é obrigatória e deve ser numérica." })
      .min(-180, "Longitude deve ser no mínimo -180.")
      .max(180, "Longitude deve ser no máximo 180.")
  ),
  rendaFamiliar: z.preprocess(
    numericPreprocess,
    z
      .number()
      .nonnegative("Renda familiar não pode ser negativa.")
      .optional()
      .nullable()
  ),
  qtdMembros: z.preprocess(
    numericPreprocess,
    z
      .number({ required_error: "Campo 'qtdMembros' é obrigatório." })
      .int("Quantidade de membros deve ser um número inteiro.")
      .nonnegative("Quantidade de membros não pode ser negativa.")
  ),
});
