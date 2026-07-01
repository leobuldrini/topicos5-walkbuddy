import { z } from "zod";

export const walkSchema = z.object({
  petId: z.string().min(1, "Selecione um pet"),
  region: z.string().min(1, "Informe a região"),
  date: z.string().min(1, "Informe a data"),
  startTime: z.string().min(1, "Informe o horário"),
  durationMin: z.coerce.number().int().positive("Duração inválida"),
  locationText: z.string().optional(),
  walkerId: z.string().optional(),
});

export type WalkInput = z.infer<typeof walkSchema>;
