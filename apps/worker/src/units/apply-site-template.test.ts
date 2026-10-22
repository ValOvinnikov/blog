import { STARTER_TEMPLATE_VERSION } from '@blog/config';
import { ERROR_CODE, PRESET_ID, SITE_TYPE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { insertSiteConfigIfMissing } from '@blog/db/queries/site-config';
import {
  getTenantById,
  setTenantSiteTemplateVersion,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import type * as TenantsQueries from '@blog/db/queries/tenants';
import { seedTenantContent } from '@worker/steps/seed-content';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { FatalError, getStepMetadata } from 'workflow';

import { applySiteTemplate } from './apply-site-template';

const CTX = { runId: 'run-1' };

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/tenants', async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal<typeof TenantsQueries>()),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock('@worker/steps/seed-content');
vi.mock('@blog/db/queries/site-config', () => ({
  insertSiteConfigIfMissing: vi.fn(),
}));
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function reportedStatuses(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(applySiteTemplate, () => {
  beforeEach(() => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 1,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });

  it('seeds the tenant and reports SEED_CONTENT running then done', async () => {
    const result = await applySiteTemplate(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
    expect(seedTenantContent).toHaveBeenCalledOnce();
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
    expect(updateProvisioningStep).toHaveBeenCalledWith(
      expect.objectContaining({ step: TENANT_PROVISIONING_STEP.SEED_CONTENT }),
    );
  });

  it.each([
    [SITE_TYPE.BLOG, SITE_TYPE.BLOG, PRESET_ID.EDITORIAL],
    [SITE_TYPE.PORTFOLIO, SITE_TYPE.PORTFOLIO, PRESET_ID.EDITORIAL],
    [null, SITE_TYPE.BLANK, PRESET_ID.CONSOLE],
  ])(
    'a tenant of site type %s is seeded as %s with the %s preset and the template version',
    async (siteType, seededType, preset) => {
      const tenant = makeTenant({ siteType });
      vi.mocked(getTenantById).mockResolvedValue(tenant);

      await applySiteTemplate(TEST_TENANT_ID, CTX);

      expect(vi.mocked(seedTenantContent).mock.calls[0]?.[1]).toBe(seededType);
      expect(insertSiteConfigIfMissing).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        preset,
      );
      expect(setTenantSiteTemplateVersion).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        STARTER_TEMPLATE_VERSION,
      );
    },
  );

  it('records neither the preset nor the template version when seeding fails', async () => {
    vi.mocked(seedTenantContent).mockRejectedValue(new Error('seed failed'));

    await applySiteTemplate(TEST_TENANT_ID, CTX).catch(() => undefined);

    expect(insertSiteConfigIfMissing).not.toHaveBeenCalled();
    expect(setTenantSiteTemplateVersion).not.toHaveBeenCalled();
  });

  it('throws a fatal error without seeding for a missing tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(applySiteTemplate(TEST_TENANT_ID, CTX)).rejects.toThrow(
      FatalError,
    );

    expect(seedTenantContent).not.toHaveBeenCalled();
    expect(insertSiteConfigIfMissing).not.toHaveBeenCalled();
  });
});
