import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

export const getProvisionEnv = vi.fn((): TProvisionEnv => ({
  sanityManagementToken: 'management-token',
  sanityOrganizationId: 'org-1',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'production',
  webAppBaseUrl: 'https://web.example.com',
  revalidateSecret: 'revalidate-secret',
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  githubActor: undefined,
  tenantRegistryEnvironment: undefined,
}));
