// Fails the build if this module is ever pulled into a client bundle — the
// Sanity write client reads SANITY_API_WRITE_TOKEN and must stay server-only.
import 'server-only';

import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

type TSanityWriteClient = ReturnType<typeof createClient>;

let writeClient: TSanityWriteClient | undefined;

/**
 * Separate from `getClient()` (the public read client): this one carries a
 * scoped write token and is used only by the publish-time skim pipeline
 * (`features/editorial/skim`) to patch a post's *draft*. Never imported by
 * page-rendering code.
 */
export function getWriteClient(): TSanityWriteClient {
  if (!env.SANITY_API_WRITE_TOKEN) {
    throw new Error(
      'getWriteClient: SANITY_API_WRITE_TOKEN is not set — the publish-time skim pipeline is disabled without a scoped write token.',
    );
  }

  if (writeClient) return writeClient;

  writeClient = createClient({
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: env.SANITY_API_WRITE_TOKEN,
    // Mutations target exact `_id`s (draft vs published) directly, and
    // `getDocument` below needs to resolve the published id even though a
    // draft may also exist — `raw` (unlike `published`) makes both visible.
    perspective: 'raw',
  });

  return writeClient;
}
