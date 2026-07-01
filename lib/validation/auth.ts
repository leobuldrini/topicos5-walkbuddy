import { z } from "zod";
export const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  displayName: z.string().min(1, "Informe seu nome"),
  roles: z.array(z.enum(["tutor", "walker"])).min(1, "Selecione ao menos um perfil"),
});
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
