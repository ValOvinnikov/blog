import { createClient, type SanityClient } from '@sanity/client';
import type { TSanityPerspective } from '@shinefold/config/constants';
import { SANITY_API_TIMEOUT_MS } from '@shinefold/db/utils/sanity-management-client/sanity-api-request';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';

export type TTenantSanityClient = SanityClient;

export type TTenantSanityClientOptions = {
  projectId: string;
  dataset: string;
  token: string;
  perspective?: TSanityPerspective;
};

export function createTenantSanityClient({
  projectId,
  dataset,
  token,
  perspective,
}: TTenantSanityClientOptions): TTenantSanityClient {
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    timeout: SANITY_API_TIMEOUT_MS,
    ...(perspective && { perspective }),
  });
}
