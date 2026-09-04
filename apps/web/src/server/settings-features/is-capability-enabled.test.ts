import { CAPABILITY } from '@blog/config';
import { getTenantPlan } from '@web/server/tenant/get-tenant-plan';

import { getEffectiveSettingsFeatures } from './get-effective-settings-features';
import { isCapabilityEnabled } from './is-capability-enabled';

vi.mock('@web/server/tenant/get-tenant-plan', () => ({
  getTenantPlan: vi.fn(),
}));
vi.mock('./get-effective-settings-features', () => ({
  getEffectiveSettingsFeatures: vi.fn(),
}));

// `isCapabilityEnabled` imports `PLAN_REGISTRY` directly from `@blog/db` —
// mocked here (mirroring `@blog/db`'s real value) so this test never pulls
// in the package's real `client.ts`, which validates `DATABASE_URL` at
// import time.
vi.mock('@blog/db', () => ({
  PLAN_REGISTRY: {
    FREE: ['COMMENTS', 'RATINGS', 'BOOKMARKS'],
    GROWTH: ['COMMENTS', 'RATINGS', 'BOOKMARKS', 'NEWSLETTER', 'ANALYTICS'],
  },
}));

const ALL_ENABLED = {
  [CAPABILITY.COMMENTS]: true,
  [CAPABILITY.RATINGS]: true,
  [CAPABILITY.BOOKMARKS]: true,
  [CAPABILITY.NEWSLETTER]: true,
  [CAPABILITY.ANALYTICS]: true,
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

  it('forwards an explicitly supplied tenant to both reads', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue({ ok: true, data: 'GROWTH' });
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue({
      ok: true,
      data: ALL_ENABLED,
    });

    await isCapabilityEnabled(CAPABILITY.NEWSLETTER, 'tenant-1');

    expect(getTenantPlan).toHaveBeenCalledWith('tenant-1');
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith('tenant-1');
  });
});
