import { createClient, type SanityClient } from '@sanity/client';
import type { TSanityPerspective } from '@shinefold/config/constants';
import { SANITY_API_TIMEOUT_MS } from '@shinefold/db/utils/sanity-management-client/sanity-api-request';
import { isUndefined } from '@shinefold/utils/primitives';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';

export type TTenantSanityClient = SanityClient;

export type TTenantSanityClientOptions = {
  projectId: string;
  dataset: string;
  token: string;
  perspective?: TSanityPerspective;
  timeoutMs?: number;
  maxRetries?: number;
};

export function createTenantSanityClient({
  projectId,
  dataset,
  token,
  perspective,
  timeoutMs = SANITY_API_TIMEOUT_MS,
  maxRetries,
}: TTenantSanityClientOptions): TTenantSanityClient {
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    timeout: timeoutMs,
    ...(perspective && { perspective }),
    ...(!isUndefined(maxRetries) && { maxRetries }),
  });
}
