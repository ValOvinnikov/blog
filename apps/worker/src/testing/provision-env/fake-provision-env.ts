import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

export const MOCK_PROVISION_ENV: TProvisionEnv = {
  sanityManagementToken: 'management-token',
  sanityOrganizationId: 'org-1',
  productName: 'Product',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  platformAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'production',
  webAppBaseUrl: 'https://web.example.com',
  revalidateSecret: 'revalidate-secret',
};

export const MOCK_REVALIDATE_WEBHOOK_URL =
  'https://web.example.com/api/revalidate';
