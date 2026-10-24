'use server';

import {
  getEnabledOAuthProviderIds,
  type TOAuthProviderId,
} from '@blog/auth/utils/oauth-providers/oauth-providers';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { z } from 'zod';

import { signIn } from './auth';

const signInWithProviderInputSchema = z.object({
  providerId: z.custom<TOAuthProviderId>((value) =>
    getEnabledOAuthProviderIds().some((id) => id === value),
  ),
  callbackPath: z.string(),
});

export type TSignInWithProviderInput = z.input<
  typeof signInWithProviderInputSchema
>;

export const signInWithProviderAction = async (
  input: TSignInWithProviderInput,
): Promise<void> => {
  const parsed = signInWithProviderInputSchema.safeParse(input);
  if (!parsed.success) return;

  const { providerId, callbackPath } = parsed.data;

  await signIn(providerId, { redirectTo: toSafeCallbackPath(callbackPath) });
};
