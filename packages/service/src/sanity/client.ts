import { createClient } from 'next-sanity';

type TSanityClient = ReturnType<typeof createClient>;

let client: TSanityClient | undefined;

export function getClient(): TSanityClient {
  if (client) return client;

  const projectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];

  if (!projectId) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  }

  client = createClient({
    projectId,
    dataset: process.env['NEXT_PUBLIC_SANITY_DATASET'] ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: process.env['NODE_ENV'] === 'production',
    token: process.env['SANITY_API_READ_TOKEN'],
  });

  return client;
}
