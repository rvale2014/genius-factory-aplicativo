import { z } from "zod";

export const MateriaDisponivelSchema = z.object({
  id: z.string(),
  nome: z.string(),
  quantidadeDisponivel: z.number().int().nonnegative(),
});
export type MateriaDisponivel = z.infer<typeof MateriaDisponivelSchema>;

export const SimuladoGeradoSchema = z.object({
  mensagem: z.string(),
  simulado: z.object({ id: z.string() }),
});
export type SimuladoGerado = z.infer<typeof SimuladoGeradoSchema>;
