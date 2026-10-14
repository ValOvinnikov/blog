import type { TMaybeUndefined } from '@blog/config';

export type TTenantProvisioningRepo = {
  owner: string;
  repo: string;
};

export const parseTenantProvisioningRepo = (
  value: TMaybeUndefined<string>,
): TMaybeUndefined<TTenantProvisioningRepo> => {
  if (!value) return undefined;

  const [owner, repo] = value.split('/');
  return owner && repo ? { owner, repo } : undefined;
};
