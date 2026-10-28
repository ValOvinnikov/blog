import { ensureCustomDomainDisconnected } from '@worker/units/ensure-custom-domain-disconnected';

export async function disconnectCustomDomain(
  tenantId: string,
  domain: string,
): Promise<void> {
  'use workflow';

  await ensureCustomDomainDisconnected(tenantId, domain);
}
