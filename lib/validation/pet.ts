import { z } from "zod";
export const petSchema = z.object({
  name: z.string().min(1, "Informe o nome do pet"),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE"], { message: "Selecione o porte" }),
  breed: z.string().optional(),
  age: z.coerce.number().int().min(0).optional(),
  behavior: z.string().optional(),
  notes: z.string().optional(),
});
export type PetInput = z.infer<typeof petSchema>;
