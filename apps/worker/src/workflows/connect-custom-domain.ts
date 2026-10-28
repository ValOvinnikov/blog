import { ensureCustomDomainConnected } from '@worker/units/ensure-custom-domain-connected';

export async function connectCustomDomain(
  tenantId: string,
  domain: string,
): Promise<void> {
  'use workflow';

  await ensureCustomDomainConnected(tenantId, domain);
}
