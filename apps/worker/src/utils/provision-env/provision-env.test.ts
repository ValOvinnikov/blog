import { FatalError } from 'workflow';

import { getProvisionEnv } from './provision-env';

const mockEnv = vi.hoisted(() => ({
  SANITY_MANAGEMENT_TOKEN: 'secret-management-token' as string | undefined,
  SANITY_ORGANIZATION_ID: 'org-1' as string | undefined,
  VERCEL_TOKEN: 'secret-vercel-token' as string | undefined,
  VERCEL_TEAM_ID: undefined as string | undefined,
  VERCEL_PROJECT_ID_WEB: 'prj_web' as string | undefined,
  ADMIN_APP_BASE_URL: 'https://admin.example.com' as string | undefined,
  TENANT_SANITY_DATASET: 'production' as string | undefined,
  WEB_APP_URL: 'https://web.example.com' as string | undefined,
  SANITY_REVALIDATE_SECRET: 'secret-revalidate' as string | undefined,
}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));

const REQUIRED = [
  'SANITY_MANAGEMENT_TOKEN',
  'SANITY_ORGANIZATION_ID',
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID_WEB',
  'ADMIN_APP_BASE_URL',
  'TENANT_SANITY_DATASET',
  'WEB_APP_URL',
  'SANITY_REVALIDATE_SECRET',
] as const;

describe(getProvisionEnv, () => {
  const original = { ...mockEnv };

  afterEach(() => {
    Object.assign(mockEnv, original);
  });

  it('maps the worker env onto the provisioning env', () => {
    const provisionEnv = getProvisionEnv();

    expect(provisionEnv).toMatchObject({
      sanityManagementToken: 'secret-management-token',
      vercelToken: 'secret-vercel-token',
      webAppBaseUrl: 'https://web.example.com',
      vercelTeamId: undefined,
    });
  });

  it.each(REQUIRED)(
    'throws a fatal error naming %s when it is unset',
    (name) => {
      Object.assign(mockEnv, { [name]: undefined });

      expect(() => getProvisionEnv()).toThrow(FatalError);
      expect(() => getProvisionEnv()).toThrow(name);
    },
  );

  it('never puts another variable value in the error', () => {
    Object.assign(mockEnv, { WEB_APP_URL: undefined });

    expect(() => getProvisionEnv()).not.toThrow(/secret-/);
  });
});
