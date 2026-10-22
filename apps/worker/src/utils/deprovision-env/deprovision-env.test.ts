import type { TMaybeUndefined } from '@blog/config';
import { FatalError } from 'workflow';

import { getDeprovisionEnv } from './deprovision-env';

const { mockEnv, REQUIRED_ENV } = vi.hoisted(() => {
  const required = {
    SANITY_MANAGEMENT_TOKEN: 'deprovision-management-token',
    VERCEL_TOKEN: 'deprovision-vercel-token',
    VERCEL_PROJECT_ID_WEB: 'prj_deprovision_web',
    WEB_APP_URL: 'https://deprovision-web.example.com',
    SITE_CONFIG_REVALIDATE_SECRET: 'deprovision-site-config-secret',
  };
  return {
    REQUIRED_ENV: required,
    mockEnv: { ...required } as Record<string, TMaybeUndefined<string>>,
  };
});

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));

describe(getDeprovisionEnv, () => {
  afterEach(() => {
    Object.assign(mockEnv, REQUIRED_ENV);
  });

  it('maps the worker env onto the deprovisioning env', () => {
    expect(getDeprovisionEnv()).toEqual({
      sanityManagementToken: REQUIRED_ENV.SANITY_MANAGEMENT_TOKEN,
      vercelToken: REQUIRED_ENV.VERCEL_TOKEN,
      vercelTeamId: undefined,
      vercelWebProjectId: REQUIRED_ENV.VERCEL_PROJECT_ID_WEB,
      webAppBaseUrl: REQUIRED_ENV.WEB_APP_URL,
      siteConfigRevalidateSecret: REQUIRED_ENV.SITE_CONFIG_REVALIDATE_SECRET,
    });
  });

  it.each(Object.keys(REQUIRED_ENV))(
    'fails permanently when %s is missing',
    (name) => {
      mockEnv[name] = undefined;

      expect(() => getDeprovisionEnv()).toThrow(FatalError);
      expect(() => getDeprovisionEnv()).toThrow(name);
    },
  );
});
