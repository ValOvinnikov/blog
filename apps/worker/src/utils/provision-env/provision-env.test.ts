import type { TMaybeUndefined } from '@blog/config';
import { FatalError } from 'workflow';

import { getProvisionEnv } from './provision-env';

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({
  SANITY_MANAGEMENT_TOKEN: 'secret-management-token',
  SANITY_ORGANIZATION_ID: 'org-1',
  VERCEL_TOKEN: 'secret-vercel-token',
  VERCEL_TEAM_ID: undefined,
  VERCEL_PROJECT_ID_WEB: 'prj_web',
  PLATFORM_APP_BASE_URL: 'https://admin.example.com',
  TENANT_SANITY_DATASET: 'production',
  WEB_APP_URL: 'https://web.example.com',
  SANITY_REVALIDATE_SECRET: 'secret-revalidate',
}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));

const REQUIRED = Object.entries(mockEnv)
  .filter(([, value]) => value !== undefined)
  .map(([name]) => name);

describe(getProvisionEnv, () => {
  const original = { ...mockEnv };

  afterEach(() => {
    Object.assign(mockEnv, original);
  });

  it('maps the worker env onto the provisioning env', () => {
    const provisionEnv = getProvisionEnv();

    expect(provisionEnv).toMatchObject({
      sanityManagementToken: mockEnv.SANITY_MANAGEMENT_TOKEN,
      vercelToken: mockEnv.VERCEL_TOKEN,
      webAppBaseUrl: mockEnv.WEB_APP_URL,
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
