import type { TTenant } from '@blog/db/schema/tenants';
import { DEFAULT_OWNER_EMAIL_FROM_ADDRESS } from '@worker/constants/owner-email';
import { env } from '@worker/utils/env/env';

export function ownerEmailFromAddress(): string {
  return env.OWNER_EMAIL_FROM_ADDRESS ?? DEFAULT_OWNER_EMAIL_FROM_ADDRESS;
}

export function tenantSiteUrl({ primaryDomain }: TTenant): string {
  return `https://${primaryDomain}`;
}
