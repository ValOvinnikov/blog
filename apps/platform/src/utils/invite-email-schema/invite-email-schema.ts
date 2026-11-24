import { z } from 'zod';

export const inviteEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());
