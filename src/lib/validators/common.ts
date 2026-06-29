import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const workspaceIdSchema = z.object({
  workspaceId: uuidSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});
