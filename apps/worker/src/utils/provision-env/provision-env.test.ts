import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_WORKER_ENV } from '@worker/testing/worker-env/mock-worker-env';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { FatalError } from 'workflow';

import { getProvisionEnv } from './provision-env';

vi.mock('@worker/utils/env/env');

const REQUIRED_ENV_NAMES = [
  'SANITY_MANAGEMENT_TOKEN',
  'SANITY_ORGANIZATION_ID',
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID_WEB',
  'PLATFORM_APP_BASE_URL',
  'TENANT_SANITY_DATASET',
  'WEB_APP_URL',
  'SANITY_REVALIDATE_SECRET',
];

describe(getProvisionEnv, () => {
  beforeEach(() => {
    Object.assign(mockEnv, MOCK_WORKER_ENV);
  });

  it('maps the worker env onto the provisioning env', () => {
    expect(getProvisionEnv()).toEqual(MOCK_PROVISION_ENV);
  });

  it.each(REQUIRED_ENV_NAMES)(
    'throws a fatal error naming %s when it is unset',
    (name) => {
      mockEnv[name] = undefined;

      expect(() => getProvisionEnv()).toThrow(FatalError);
      expect(() => getProvisionEnv()).toThrow(name);
    },
  );

  it('never puts another variable value in the error', () => {
    mockEnv.WEB_APP_URL = undefined;

    expect(() => getProvisionEnv()).toThrow(FatalError);
    expect(() => getProvisionEnv()).not.toThrow(
      MOCK_PROVISION_ENV.sanityManagementToken,
    );
    expect(() => getProvisionEnv()).not.toThrow(
      MOCK_PROVISION_ENV.revalidateSecret,
    );
  });
});
