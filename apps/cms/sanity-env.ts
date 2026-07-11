/**
 * Fail-fast reader for the Sanity project/dataset env vars, so the real project
 * id is never hardcoded in this (public) repo.
 *
 * The Studio only exposes `SANITY_STUDIO_*`-prefixed vars to its browser
 * bundle, so both `sanity.config.ts` and `sanity.cli.ts` read that prefix.
 * Always pass the `process.env.SANITY_STUDIO_*` access *inline* at the call
 * site (never a dynamic `process.env[name]` lookup) so Sanity's bundler can
 * statically inline the value into the Studio.
 *
 * Set these locally in `apps/cms/.env`; provide them via the environment
 * (GitHub Actions repo variables / Vercel env) everywhere else.
 */
export const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Missing required env ${name}. Set it in apps/cms/.env (locally) or as a ` +
        `GitHub Actions / deploy environment variable.`,
    );
  }

  return value;
};
