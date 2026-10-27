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
import { errorResult } from '@blog/utils/result';
import { seedTenantContent } from '@worker/steps/seed-content';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { FatalError } from 'workflow';

import { applySiteTemplate } from './apply-site-template';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/steps/seed-content');
vi.mock('@blog/db/queries/site-config');
vi.mock('workflow');

function reportedStatuses(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(applySiteTemplate, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(updateProvisioningStep).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
  });

  it('seeds the tenant and reports SEED_CONTENT running then done', async () => {
    const result = await applySiteTemplate(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(seedTenantContent).toHaveBeenCalledOnce();
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
    expect(updateProvisioningStep).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });
  });

  it.each([
    [SITE_TYPE.BLOG, SITE_TYPE.BLOG, PRESET_ID.EDITORIAL],
    [SITE_TYPE.PORTFOLIO, SITE_TYPE.PORTFOLIO, PRESET_ID.EDITORIAL],
    [SITE_TYPE.PERSONAL, SITE_TYPE.PERSONAL, PRESET_ID.EDITORIAL],
    [null, SITE_TYPE.BLANK, PRESET_ID.CONSOLE],
  ])(
    'seeds site type %s as %s with the %s preset and the template version',
    async (siteType, seededType, preset) => {
      const tenant = mockTenant({ siteType });
      vi.mocked(getTenantById).mockResolvedValue(tenant);

      await applySiteTemplate(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

      expect(vi.mocked(seedTenantContent).mock.calls[0]?.[1]).toBe(seededType);
      expect(insertSiteConfigIfMissing).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        preset,
      );
      expect(setTenantSiteTemplateVersion).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        STARTER_TEMPLATE_VERSION,
      );
    },
  );

  it('records no preset or template version when seeding fails', async () => {
    vi.mocked(seedTenantContent).mockRejectedValue(new Error('seed failed'));

    await applySiteTemplate(MOCK_TENANT_ID, MOCK_RUN_CONTEXT).catch(
      () => undefined,
    );

    expect(insertSiteConfigIfMissing).not.toHaveBeenCalled();
    expect(setTenantSiteTemplateVersion).not.toHaveBeenCalled();
  });

  it('throws a fatal error without seeding for a missing tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(
      applySiteTemplate(MOCK_TENANT_ID, MOCK_RUN_CONTEXT),
    ).rejects.toThrow(FatalError);

    expect(seedTenantContent).not.toHaveBeenCalled();
    expect(insertSiteConfigIfMissing).not.toHaveBeenCalled();
  });
});
