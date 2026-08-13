import 'server-only';

import { sendEmail } from '@admin/server/email/send-email';
import { buildAuthConfig } from '@blog/auth';
import NextAuth from 'next-auth';

// Config is a function — Auth.js v5's lazy-initialization form — so
// `buildAuthConfig`'s `DrizzleAdapter(getDb(), …)`, and therefore
// `getDb()`'s `neon(DATABASE_URL)` construction, is deferred to the first
// real request instead of running at module-import time, which would
// otherwise crash Next's build-time "Collecting page data" step against a
// `DATABASE_URL` that's legitimately unset in CI. Same reasoning as
// `apps/web/src/server/auth/auth.ts`.
const { handlers, auth } = NextAuth(() => buildAuthConfig({ sendEmail }));

export const { GET, POST } = handlers;
export { auth };
