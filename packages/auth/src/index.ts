// Ambient module augmentation (`session.user.id`) — a side-effect import so
// every consumer's TypeScript program picks it up simply by importing this
// package, with no separate declaration of its own to keep in sync.
import '@blog/auth/types/next-auth';

export type {
  TSendEmail,
  TSendEmailInput,
} from '@blog/auth/providers/magic-link/magic-link-provider';
export { buildAuthConfig, type TBuildAuthConfigOptions } from './config';
