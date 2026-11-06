import { OAUTH_PROVIDER } from '@blog/config/constants';
import { z } from 'zod';

export const signInAppInputSchema = z.object({
  provider: z.enum(OAUTH_PROVIDER),
  clientId: z.string().trim(),
  clientSecret: z.string().trim().optional(),
});

export type TSignInAppInput = z.input<typeof signInAppInputSchema>;

export const signInAppProviderSchema = z.enum(OAUTH_PROVIDER);
