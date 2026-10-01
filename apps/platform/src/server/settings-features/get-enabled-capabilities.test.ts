import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';

import { getEnabledCapabilities } from './get-enabled-capabilities';

const { getSettingsFeaturesOrDefaultsMock } = vi.hoisted(() => ({
  getSettingsFeaturesOrDefaultsMock: vi.fn(),
}));

vi.mock(
  '@platform/server/settings-features/settings-features-or-defaults',
  () => ({
    getSettingsFeaturesOrDefaults: getSettingsFeaturesOrDefaultsMock,
  }),
);

const allOn = {
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: true,
  analyticsEnabled: true,
  consentBannerEnabled: true,
};

describe(getEnabledCapabilities, () => {
  beforeEach(() => {
    getSettingsFeaturesOrDefaultsMock.mockReset();
  });

  it('includes a capability the plan entitles and the toggle enables', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue(allOn);

    const result = await getEnabledCapabilities({
      id: 'tenant-1',
      plan: TENANT_PLAN.GROWTH,
    });

    expect(getSettingsFeaturesOrDefaultsMock).toHaveBeenCalledWith('tenant-1');
    expect(result).toContain(CAPABILITY.NEWSLETTER);
  });

  it('omits a capability whose toggle is off even when the plan entitles it', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      ...allOn,
      newsletterEnabled: false,
    });

    const result = await getEnabledCapabilities({
      id: 'tenant-1',
      plan: TENANT_PLAN.GROWTH,
    });

    expect(result).not.toContain(CAPABILITY.NEWSLETTER);
    expect(result).toContain(CAPABILITY.COMMENTS);
  });

  it('omits a capability the plan does not entitle even when its toggle is on', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue(allOn);

    const result = await getEnabledCapabilities({
      id: 'tenant-1',
      plan: TENANT_PLAN.FREE,
    });

    expect(result).not.toContain(CAPABILITY.NEWSLETTER);
    expect(result).toContain(CAPABILITY.COMMENTS);
  });
});
