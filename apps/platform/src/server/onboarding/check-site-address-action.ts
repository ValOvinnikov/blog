'use server';

import type { TMaybeUndefined } from '@blog/config';
import {
  checkTenantSlug,
  type TTenantSlugError,
} from '@platform/server/tenants/check-tenant-slug';
import { env } from '@platform/utils/env/env';
import { z } from 'zod';

import { requireOnboardingUser } from './require-onboarding-user';

const siteAddressSchema = z.string().trim().toLowerCase();

export const checkSiteAddressAction = async (
  slug: string,
): Promise<TMaybeUndefined<TTenantSlugError>> => {
  await requireOnboardingUser();

  const rootDomain = env.TENANT_ROOT_DOMAIN;
  const parsed = siteAddressSchema.safeParse(slug);
  if (!rootDomain || !parsed.success) return undefined;

  return checkTenantSlug(parsed.data, rootDomain);
};
