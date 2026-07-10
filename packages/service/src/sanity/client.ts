import { createClient } from 'next-sanity';

import { env } from '#/utils/env/env';

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
  });

  return client;
}
