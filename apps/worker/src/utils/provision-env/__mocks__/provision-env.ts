import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

export const getProvisionEnv = vi.fn((): TProvisionEnv => MOCK_PROVISION_ENV);
