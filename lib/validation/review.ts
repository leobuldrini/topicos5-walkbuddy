import { z } from "zod";

export const reviewSchema = z.object({
  walkRequestId: z.string().min(1),
  targetType: z.enum(["walker", "tutor", "pet"]),
  targetId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Nota mínima 1").max(5, "Nota máxima 5"),
  comment: z.string().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
