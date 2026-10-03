import { CAPABILITY } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { isCapabilityEnabled } from './is-capability-enabled';

vi.mock('@web/server/settings-features/get-tenant-plan/get-tenant-plan', () => ({
  getTenantPlan: vi.fn(),
}));
vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/settings-features/get-effective-settings-features/get-effective-settings-features', () => ({
  getEffectiveSettingsFeatures: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  PLAN_REGISTRY: {
    FREE: ['RATINGS', 'CONSENT_BANNER'],
    GROWTH: [
      'COMMENTS',
      'RATINGS',
      'BOOKMARKS',
      'NEWSLETTER',
      'ANALYTICS',
      'CONSENT_BANNER',
    ],
  },
}));

const ALL_ENABLED = {
  [CAPABILITY.COMMENTS]: true,
  [CAPABILITY.RATINGS]: true,
  [CAPABILITY.BOOKMARKS]: true,
  [CAPABILITY.NEWSLETTER]: true,
  [CAPABILITY.ANALYTICS]: true,
  [CAPABILITY.CONSENT_BANNER]: true,
};

describe(isCapabilityEnabled, () => {
  beforeEach(() => {
    vi.mocked(getTenantPlan).mockReset();
    vi.mocked(getEffectiveSettingsFeatures).mockReset();
  });

  it('enables a capability when both the plan entitles it and the toggle is on', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: ALL_ENABLED,
    });

    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      true,
    );
  });

  it('disables a capability the plan does not entitle, even when the toggle is on', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'FREE' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: ALL_ENABLED,
    });

    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      false,
    );
  });

  it('disables a capability the tenant has toggled off, even when the plan entitles it', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: { ...ALL_ENABLED, [CAPABILITY.NEWSLETTER]: false },
    });

    await expect(isCapabilityEnabled(CAPABILITY.NEWSLETTER)).resolves.toBe(
      false,
    );
  });

  it('resolves false when no tenant is resolved for either read', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: undefined });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: undefined,
    });

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the plan fetch fails', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: undefined,
    });

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the effective features fetch fails', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it("reads both entitlements for the request context's tenant", async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: ALL_ENABLED,
    });

    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith('tenant-1');
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith('tenant-1');
  });

  it('reads the unresolved-tenant placeholder, never undefined, when the request has no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      tenantId: undefined,
    });
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: ALL_ENABLED,
    });

    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith(UNRESOLVED_TENANT_PLACEHOLDER);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });
});
