// `src/types/next-auth.d.ts` augments `next-auth`'s `Session` with
// `user.id`. Ambient declarations aren't reachable by importing them —
// each consuming program (this package's own `tsconfig.json` and every
// consumer's) must include that file directly.
export type {
  TSendEmail,
  TSendEmailInput,
} from '@blog/auth/providers/magic-link/magic-link-provider';
export { buildAuthConfig, type TBuildAuthConfigOptions } from './config';
export {
  getEnabledOAuthProviderIds,
  type TOAuthProviderId,
} from './utils/oauth-providers/oauth-providers';
