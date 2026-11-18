import type { TMaybeUndefined } from '@shinefold/config/types';

// Pass `process.env.SANITY_STUDIO_*` inline at each call site: Sanity's bundler inlines only static env reads.
export const requireEnv = (
  name: string,
  value: TMaybeUndefined<string>,
): string => {
  if (!value) {
    throw new Error(
      `Missing required env ${name}. Set it in packages/studio/.env (locally) or as a ` +
        `GitHub Actions / deploy environment variable.`,
    );
  }

  return value;
};
