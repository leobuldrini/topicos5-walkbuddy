import { z } from "zod";
export const walkerSchema = z.object({
  bio: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0),
  basePrice: z.coerce.number().min(0, "Preço não pode ser negativo"),
  serviceRegion: z.string().min(1, "Informe a região de atendimento"),
  acceptedSizes: z.array(z.enum(["PEQUENO", "MEDIO", "GRANDE"])).min(1, "Selecione ao menos um porte"),
  acceptedBehaviors: z.array(z.string()).default([]),
});
export const availabilitySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
}).refine((v) => v.endTime > v.startTime, { message: "Fim deve ser após o início", path: ["endTime"] });
