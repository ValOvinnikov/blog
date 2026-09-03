import type { TTenantSanityContext } from '@blog/service/sanity/query';

export function makeTenant(
  overrides: Partial<TTenantSanityContext> = {},
): TTenantSanityContext {
  return {
    projectId: 'tenant-a',
    dataset: 'production',
    token: 'tok-a',
    ...overrides,
  };
}
