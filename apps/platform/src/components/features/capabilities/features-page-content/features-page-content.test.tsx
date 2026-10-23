import { PRESET_ID } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { FeaturesPageContent } from './features-page-content';

const { getSettingsFeaturesAndPresetMock } = vi.hoisted(() => ({
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

vi.mock('@platform/server/auth/auth');

const buildTenant = (plan: TTenant['plan']): TTenant =>
  mockReadyTenant({ plan });

const setup = customRenderAsync(FeaturesPageContent, {
  tenant: buildTenant(TENANT_PLAN.FREE),
});

const DATA_CHECKED = 'data-checked';
const DATA_UNCHECKED = 'data-unchecked';
const DATA_DISABLED = 'data-disabled';
const BOOKMARKS_LABEL = 'Bookmarks';
const CONSENT_BANNER_LABEL = 'Cookie consent banner';

describe(`<${FeaturesPageContent.name}/>`, () => {
  beforeEach(() => {
    getSettingsFeaturesAndPresetMock.mockReset();
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: undefined,
    });
  });

  describe('for a GROWTH-plan tenant', () => {
    beforeEach(async () => {
      await setup({ tenant: buildTenant(TENANT_PLAN.GROWTH) });
    });

    it('renders CONSOLE featureDefaults with no settings_features or site_config row', () => {
      expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      const bookmarksSwitch = screen.getByRole('switch', {
        name: BOOKMARKS_LABEL,
      });
      const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });

      expect(bookmarksSwitch).toHaveAttribute(DATA_CHECKED, '');
      expect(analyticsSwitch).toHaveAttribute(DATA_UNCHECKED, '');
    });

    it('enables every toggle for a GROWTH-plan tenant', () => {
      const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });
      const consentSwitch = screen.getByRole('switch', {
        name: CONSENT_BANNER_LABEL,
      });

      expect(analyticsSwitch).not.toHaveAttribute(DATA_DISABLED);
      expect(consentSwitch).not.toHaveAttribute(DATA_DISABLED);
    });
  });

  it("renders the tenant's saved settings_features row when one exists", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: {
        commentsEnabled: true,
        ratingsEnabled: true,
        bookmarksEnabled: false,
        newsletterEnabled: true,
        analyticsEnabled: true,
        consentBannerEnabled: false,
      },
      preset: undefined,
    });

    await setup({ tenant: buildTenant(TENANT_PLAN.GROWTH) });

    const bookmarksSwitch = screen.getByRole('switch', {
      name: BOOKMARKS_LABEL,
    });
    const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });

    expect(bookmarksSwitch).toHaveAttribute(DATA_UNCHECKED, '');
    expect(analyticsSwitch).toHaveAttribute(DATA_CHECKED, '');
  });

  it('falls back to EDITORIAL featureDefaults when site_config has that preset saved', async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: PRESET_ID.EDITORIAL,
    });

    await setup({ tenant: buildTenant(TENANT_PLAN.GROWTH) });

    const bookmarksSwitch = screen.getByRole('switch', {
      name: BOOKMARKS_LABEL,
    });

    expect(bookmarksSwitch).toHaveAttribute(DATA_CHECKED, '');
  });

  it('disables the GROWTH-only toggles for a FREE-plan tenant', async () => {
    await setup({ tenant: buildTenant(TENANT_PLAN.FREE) });

    const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });
    const bookmarksSwitch = screen.getByRole('switch', {
      name: BOOKMARKS_LABEL,
    });
    const consentSwitch = screen.getByRole('switch', {
      name: CONSENT_BANNER_LABEL,
    });

    expect(analyticsSwitch).toHaveAttribute(DATA_DISABLED, '');
    expect(bookmarksSwitch).toHaveAttribute(DATA_DISABLED, '');
    expect(consentSwitch).not.toHaveAttribute(DATA_DISABLED);
  });

  it('clamps a stale out-of-plan value to unchecked+disabled after a plan downgrade', async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: {
        commentsEnabled: true,
        ratingsEnabled: true,
        bookmarksEnabled: true,
        newsletterEnabled: false,
        analyticsEnabled: true,
        consentBannerEnabled: false,
      },
      preset: undefined,
    });

    await setup({ tenant: buildTenant(TENANT_PLAN.FREE) });

    const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });
    expect(analyticsSwitch).toHaveAttribute(DATA_UNCHECKED, '');
    expect(analyticsSwitch).toHaveAttribute(DATA_DISABLED, '');
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    const tenant = buildTenant(TENANT_PLAN.FREE);
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const saveButton = screen.queryByRole('button', { name: 'Save changes' });

    expect(archivedNotice).toBeVisible();
    expect(saveButton).not.toBeInTheDocument();
  });
});
