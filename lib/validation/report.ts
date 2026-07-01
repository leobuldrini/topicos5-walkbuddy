import { z } from "zod";

export const reportSchema = z.object({
  reportedUserId: z.string().min(1, "Usuário inválido"),
  walkRequestId: z.string().optional(),
  reason: z.string().min(3, "Descreva o motivo"),
});

export type ReportInput = z.infer<typeof reportSchema>;
