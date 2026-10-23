import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from './is-capability-enabled';

vi.mock(
  '@web/server/settings-features/get-tenant-plan/get-tenant-plan',
  () => ({
    getTenantPlan: vi.fn(),
  }),
);
vi.mock('@web/server/request-context/request-context');
vi.mock(
  '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features',
  () => ({
    getEffectiveSettingsFeatures: vi.fn(),
  }),
);

vi.mock('@blog/db', () => vi.importActual('@blog/db/constants'));

const OTHER_TENANT_ID = faker.string.uuid();

const ALL_ENABLED = {
  [CAPABILITY.COMMENTS]: true,
  [CAPABILITY.RATINGS]: true,
  [CAPABILITY.BOOKMARKS]: true,
  [CAPABILITY.NEWSLETTER]: true,
  [CAPABILITY.ANALYTICS]: true,
  [CAPABILITY.CONSENT_BANNER]: true,
  [CAPABILITY.CONTACT_FORM]: true,
};

describe(isCapabilityEnabled, () => {
  beforeEach(() => {
    vi.mocked(getTenantPlan).mockReset();
    vi.mocked(getEffectiveSettingsFeatures).mockReset();
    vi.mocked(getTenantPlan).mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      okResult(ALL_ENABLED),
    );
  });

  it('enables a capability when both the plan entitles it and the toggle is on', async () => {
    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      true,
    );
  });

  it('disables a capability the plan does not entitle, even when the toggle is on', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue(okResult(TENANT_PLAN.FREE));

    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      false,
    );
  });

  it('disables a capability the tenant has toggled off, even when the plan entitles it', async () => {
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      okResult({ ...ALL_ENABLED, [CAPABILITY.NEWSLETTER]: false }),
    );

    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      false,
    );
  });

  it('enables the contact form on GROWTH while its toggle is on, and disables it once toggled off', async () => {
    await expect(isCapabilityEnabled(CAPABILITY.CONTACT_FORM)).resolves.toBe(
      true,
    );

    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      okResult({ ...ALL_ENABLED, [CAPABILITY.CONTACT_FORM]: false }),
    );

    await expect(isCapabilityEnabled(CAPABILITY.CONTACT_FORM)).resolves.toBe(
      false,
    );
  });

  it('disables the contact form on FREE even with its toggle on', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue(okResult(TENANT_PLAN.FREE));

    await expect(isCapabilityEnabled(CAPABILITY.CONTACT_FORM)).resolves.toBe(
      false,
    );
  });

  it('resolves false when no tenant is resolved for either read', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue(okResult());
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(okResult());

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the plan fetch fails', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue(errorResult(new Error('boom')));
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(okResult());

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the effective features fetch fails', async () => {
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      errorResult(new Error('boom')),
    );

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it("reads both entitlements for the request context's tenant", async () => {
    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith(DEFAULT_TENANT_ID);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
    );
  });

  it('reads the unresolved-tenant placeholder, never undefined, when the request has no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith(UNRESOLVED_TENANT_PLACEHOLDER);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });

  it('reads both entitlements for the tenant it is given, without the request context', async () => {
    vi.mocked(getRequestContext).mockClear();

    await expect(
      isCapabilityEnabledForTenant(OTHER_TENANT_ID, CAPABILITY.CONTACT_FORM),
    ).resolves.toBe(true);

    expect(getRequestContext).not.toHaveBeenCalled();
    expect(getTenantPlan).toHaveBeenCalledWith(OTHER_TENANT_ID);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(OTHER_TENANT_ID);
  });
});
