import { MOCK_DEPROVISION_ENV } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { MOCK_WORKER_ENV } from '@worker/testing/worker-env/mock-worker-env';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { FatalError } from 'workflow';

import { getDeprovisionEnv } from './deprovision-env';

vi.mock('@worker/utils/env/env');

const REQUIRED_ENV_NAMES = [
  'SANITY_MANAGEMENT_TOKEN',
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID_WEB',
  'WEB_APP_URL',
  'SITE_CONFIG_REVALIDATE_SECRET',
];

describe(getDeprovisionEnv, () => {
  beforeEach(() => {
    Object.assign(mockEnv, MOCK_WORKER_ENV);
  });

  it('maps the worker env onto the deprovisioning env', () => {
    expect(getDeprovisionEnv()).toEqual(MOCK_DEPROVISION_ENV);
  });

  it.each(REQUIRED_ENV_NAMES)(
    'fails permanently when %s is missing',
    (name) => {
      mockEnv[name] = undefined;

      expect(() => getDeprovisionEnv()).toThrow(FatalError);
      expect(() => getDeprovisionEnv()).toThrow(name);
    },
  );
});
