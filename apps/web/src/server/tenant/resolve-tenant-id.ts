import { resolveTenant } from './resolve-tenant';

export const resolveTenantId = async (
  host: string | null,
): Promise<string | undefined> => {
  const tenant = await resolveTenant(host);
  return tenant?.id;
};
