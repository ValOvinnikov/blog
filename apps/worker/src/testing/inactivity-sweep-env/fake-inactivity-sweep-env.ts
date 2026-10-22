import { getDeprovisionEnv } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { getProvisionEnv } from '@worker/testing/provision-env/fake-provision-env';
import type { TInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';

export function makeInactivitySweepEnv(): TInactivitySweepEnv {
  const { adminAppBaseUrl, webAppBaseUrl } = getProvisionEnv();
  return {
    adminAppBaseUrl,
    webAppBaseUrl,
    siteConfigRevalidateSecret: getDeprovisionEnv().siteConfigRevalidateSecret,
  };
}
