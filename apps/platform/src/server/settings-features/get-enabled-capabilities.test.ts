import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

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

const MOCK_ALL_ON = mockSettingsFeaturesValues({
  readerAccountsEnabled: true,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: true,
  analyticsEnabled: true,
  consentBannerEnabled: true,
  contactFormEnabled: true,
});

const arrangeSavedValues = (values = MOCK_ALL_ON) => {
  getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
    values,
    savedAt: undefined,
  });
};

describe(getEnabledCapabilities, () => {
  beforeEach(() => {
    getSettingsFeaturesOrDefaultsMock.mockReset();
  });

  it('includes a capability the plan entitles and the toggle enables', async () => {
    arrangeSavedValues();

    const result = await getEnabledCapabilities({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
    });

    expect(getSettingsFeaturesOrDefaultsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(result).toContain(CAPABILITY.NEWSLETTER);
  });

  it('omits a capability whose toggle is off', async () => {
    arrangeSavedValues({ ...MOCK_ALL_ON, newsletterEnabled: false });

    const result = await getEnabledCapabilities({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
    });

    expect(result).not.toContain(CAPABILITY.NEWSLETTER);
    expect(result).toContain(CAPABILITY.COMMENTS);
  });

  it('omits a capability the plan does not entitle', async () => {
    arrangeSavedValues();

    const result = await getEnabledCapabilities({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.FREE,
    });

    expect(result).not.toContain(CAPABILITY.CONTACT_FORM);
    expect(result).toContain(CAPABILITY.CONSENT_BANNER);
  });

  it('omits every Reader accounts sub-item while Reader accounts is off', async () => {
    arrangeSavedValues({ ...MOCK_ALL_ON, readerAccountsEnabled: false });

    const result = await getEnabledCapabilities({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
    });

    expect(result).not.toContain(CAPABILITY.READER_ACCOUNTS);
    expect(result).not.toContain(CAPABILITY.BOOKMARKS);
    expect(result).not.toContain(CAPABILITY.COMMENTS);
    expect(result).toContain(CAPABILITY.CONTACT_FORM);
  });
});
