import type { DefaultSession } from 'next-auth';

// Module augmentation (Auth.js's own documented pattern — see
// https://authjs.dev/getting-started/typescript#module-augmentation):
// `session.user.id` is populated by `auth.ts`'s `callbacks.session` (#1109,
// bookmarks) but isn't part of `next-auth`'s own `DefaultSession['user']`
// shape, so every reader of `auth()`/`useSession()` needs this ambient
// declaration to see it typed.
declare module 'next-auth' {
  // `Session` is `next-auth`'s own exported interface name — module
  // augmentation only merges when it's named exactly that, so the repo's
  // `I`-prefix convention doesn't apply here.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
