import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  BRAND_VARIANT,
  BUTTON_SHAPE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  BUSY_BUTTON_STYLE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HUE_MAX,
  HUE_MIN,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  NAV_LINK_STYLE,
  NEXT_NAVIGATION_ERROR,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
  type TMaybeNull,
} from '@blog/config';
import {
  BRAND_NAME_MAX_LENGTH,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/db/constants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { faker } from '@faker-js/faker';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateLookAction } from './update-look-action';
import type { TUpdateLookInput } from './update-look-input-schema';

faker.seed(5998);

const { getSiteConfigMock, upsertSiteConfigMock, insertAuditEventMock } =
  vi.hoisted(() => ({
    getSiteConfigMock: vi.fn(),
    upsertSiteConfigMock: vi.fn(),
    insertAuditEventMock: vi.fn(),
  }));

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal()),
  isAccentHueAccessible: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: {
      getSiteConfig: getSiteConfigMock,
      upsertSiteConfig: upsertSiteConfigMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);
const UNSUPPORTED_CARD_STYLE = 'SHADOWED';
const UNSUPPORTED_HEADER_LAYOUT = 'ZIGZAG';
const UNSUPPORTED_BUSY_BUTTON_STYLE = 'SHAKE';
const UNSUPPORTED_ACCOUNT_PANEL_STYLE = 'DRAWER';
const UNSUPPORTED_FOOTER_LAYOUT = 'MASONRY';

const MOCK_BRAND_NAME = faker.company.name();

const VALID_INPUT: TUpdateLookInput = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: faker.number.int({ min: HUE_MIN, max: HUE_MAX }),
  logoHue: null,
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.SM,
  density: DENSITY.COMPACT,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_GLOBE,
  cardStyle: CARD_STYLE.OUTLINED,
  headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
  headerLayout: HEADER_LAYOUT.TWO_ROWS,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  headerBarStyle: HEADER_BAR_STYLE.FLOATING,
  navLinkStyle: NAV_LINK_STYLE.UNDERLINE,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
  busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
  spinnerStyle: SPINNER_STYLE.DOTS,
  buttonShape: BUTTON_SHAPE.PILL,
  footerLayout: FOOTER_LAYOUT.CENTRED,
  footerBackground: BRAND_VARIANT.SECONDARY,
  footerSurface: FOOTER_SURFACE.CARD,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
  brandName: MOCK_BRAND_NAME,
};

const onPlan = (plan: TTenantPlan) =>
  vi.mocked(requireTenantMembership).mockImplementation(async (tenantId) => ({
    tenant: mockReadyTenant({ id: tenantId, plan }),
    membership: mockMembership({ tenantId }),
  }));

describe(updateLookAction, () => {
  beforeEach(() => {
    onPlan(TENANT_PLAN.GROWTH);
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ ...VALID_INPUT, logoHue: undefined }),
    );
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    vi.mocked(isAccentHueAccessible).mockReset();
    vi.mocked(isAccentHueAccessible).mockReturnValue(true);
  });

  it('re-resolves the tenant from the session before writing', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  describe('on Free', () => {
    beforeEach(() => {
      onPlan(TENANT_PLAN.FREE);
    });

    it('writes only the preset, accent hue, cookie settings button and brand name, leaving every Growth-only field stored as it is', async () => {
      const { preset, accentHue, cookieSettingsButton, brandName } =
        VALID_INPUT;

      await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        preset,
        accentHue,
        cookieSettingsButton,
        brandName,
      });
    });

    it('refuses a Growth-only field changed from its stored value, and writes nothing', async () => {
      const result = await updateLookAction(MOCK_TENANT_ID, {
        ...VALID_INPUT,
        radiusScale: RADIUS_SCALE.LG,
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
        values: { plan: TENANT_PLAN.FREE },
        items: ['radiusScale'],
      });
      expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    });

    it('saves an accent hue change while the Growth-only fields keep their stored values', async () => {
      const result = await updateLookAction(MOCK_TENANT_ID, {
        ...VALID_INPUT,
        accentHue: HUE_MIN,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSiteConfigMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        expect.objectContaining({ accentHue: HUE_MIN }),
      );
    });

    it('saves when the Growth-only fields hold the preset values the Free page shows', async () => {
      const presetValues = toEffectiveLook(
        { ...VALID_INPUT, logoHue: undefined, radiusScale: RADIUS_SCALE.LG },
        TENANT_PLAN.FREE,
      );

      const result = await updateLookAction(MOCK_TENANT_ID, {
        ...presetValues,
        logoHue: null,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });

    it('audits only what it wrote', async () => {
      const { preset, accentHue, cookieSettingsButton, brandName } =
        VALID_INPUT;

      await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(insertAuditEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { preset, accentHue, cookieSettingsButton, brandName },
        }),
      );
    });
  });

  it('clears the brand name when it is saved blank', async () => {
    await updateLookAction(MOCK_TENANT_ID, { ...VALID_INPUT, brandName: ' ' });

    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      expect.objectContaining({ brandName: null }),
    );
  });

  it('rejects a brand name over the length limit without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      brandName: 'x'.repeat(BRAND_NAME_MAX_LENGTH + 1),
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('revalidates the site config after a successful save', async () => {
    await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('rejects an out-of-range hue before reaching the tenant gate', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      accentHue: HUE_MAX + 1,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('rejects a card style the site has no tokens for without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      // @ts-expect-error -- an unsupported card style is the invalid input under test
      cardStyle: UNSUPPORTED_CARD_STYLE,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('rejects a footer layout the site has no arrangement for without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      // @ts-expect-error -- an unsupported footer layout is the invalid input under test
      footerLayout: UNSUPPORTED_FOOTER_LAYOUT,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('rejects a header layout the site has no arrangement for without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      // @ts-expect-error -- an unsupported header layout is the invalid input under test
      headerLayout: UNSUPPORTED_HEADER_LAYOUT,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('rejects a busy button style the site has no treatment for without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      // @ts-expect-error -- an unsupported busy button style is the invalid input under test
      busyButtonStyle: UNSUPPORTED_BUSY_BUTTON_STYLE,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('rejects an account panel the site has no layout for without writing it', async () => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      // @ts-expect-error -- an unsupported account panel style is the invalid input under test
      accountPanelStyle: UNSUPPORTED_ACCOUNT_PANEL_STYLE,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('rejects an accent hue the site would replace without writing it', async () => {
    vi.mocked(isAccentHueAccessible).mockReturnValue(false);

    const result = await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('reports a server error when the write fails', async () => {
    upsertSiteConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event on the site config by the operator', async () => {
    await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: VALID_INPUT,
    });
  });

  it('still succeeds when the audit write fails, and logs the failure', async () => {
    const auditError = new Error(MOCK_DB_ERROR_MESSAGE);
    insertAuditEventMock.mockRejectedValue(auditError);

    const result = await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.LOOK_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: MOCK_TENANT_ID,
        errorName: auditError.name,
      },
    );
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (navigationError) => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      throw new Error(navigationError);
    });

    await expect(updateLookAction(MOCK_TENANT_ID, VALID_INPUT)).rejects.toThrow(
      navigationError,
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
