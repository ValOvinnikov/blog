// Fails the build if this module is ever pulled into a client bundle — the
// Sanity client reads SANITY_API_READ_TOKEN and must stay server-only.
import 'server-only';

import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

type TSanityClient = ReturnType<typeof createClient>;

let client: TSanityClient | undefined;

export function getClient(): TSanityClient {
  if (client) return client;

  client = createClient({
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: process.env['NODE_ENV'] === 'production',
    token: env.SANITY_API_READ_TOKEN,
    // Explicit (already the default): never serve draft content to the public.
    perspective: 'published',
  });

  return client;
}
