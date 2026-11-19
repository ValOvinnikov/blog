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
import {
  mockEditorMembershipContext,
  mockMembership,
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
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
  DIVIDER_WIDTH,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  BUSY_BUTTON_STYLE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HEADING_CASE,
  HEADING_WEIGHT,
  HUE_MAX,
  HUE_MIN,
  IMAGE_PROPORTION,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  NAV_LINK_STYLE,
  NEXT_NAVIGATION_ERROR,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
  type TMaybeNull,
} from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import {
  BRAND_NAME_MAX_LENGTH,
  LOOK_FIELD,
  PLAN_ENTITLEMENTS,
  SITE_CONFIG_SAVED_AT,
} from '@shinefold/db/constants';
import { toEffectiveLookWithin } from '@shinefold/db/utils/effective-look/effective-look';
import type { Session } from 'next-auth';

import { updateLookAction } from './update-look-action';
import type { TUpdateLookInput } from './update-look-input-schema';

faker.seed(5998);

const {
  getSiteConfigMock,
  upsertSiteConfigMock,
  stampSiteConfigSavedAtMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  stampSiteConfigSavedAtMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@shinefold/config', async (importOriginal) => ({
  ...(await importOriginal()),
  isAccentHueAccessible: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@shinefold/db', () => ({
  queries: {
    siteConfig: {
      getSiteConfig: getSiteConfigMock,
      upsertSiteConfig: upsertSiteConfigMock,
      stampSiteConfigSavedAt: stampSiteConfigSavedAtMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);
const MOCK_UNSUPPORTED_LOOK_VALUE = 'HEAVY';

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
  headerControlShape: HEADER_CONTROL_SHAPE.ROUNDED,
  headerLayout: HEADER_LAYOUT.TWO_ROWS,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  headerBarStyle: HEADER_BAR_STYLE.FLOATING,
  navLinkStyle: NAV_LINK_STYLE.UNDERLINE,
  headingWeight: HEADING_WEIGHT.BOLD,
  headingCase: HEADING_CASE.UPPERCASE,
  imageProportion: IMAGE_PROPORTION.SQUARE,
  dividerWidth: DIVIDER_WIDTH.BOLD,
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

const { preset, accentHue, cookieSettingsButton, brandName } = VALID_INPUT;
const FREE_WRITTEN_INPUT = {
  preset,
  accentHue,
  cookieSettingsButton,
  brandName,
};

const onPlan = (plan: TTenantPlan) =>
  vi
    .mocked(requireTenantMembership)
    .mockImplementation(async (tenantId) =>
      mockMembershipContext(
        mockReadyTenant({ id: tenantId, plan }),
        mockMembership({ tenantId }),
      ),
    );

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
    stampSiteConfigSavedAtMock.mockReset();
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

    describe('saving every field', () => {
      beforeEach(async () => {
        await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);
      });

      it('writes only the fields Free includes, leaving Growth-only fields as stored', () => {
        expect(upsertSiteConfigMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          FREE_WRITTEN_INPUT,
        );
      });

      it('audits only what it wrote', () => {
        expect(insertAuditEventMock).toHaveBeenCalledWith(
          expect.objectContaining({ details: FREE_WRITTEN_INPUT }),
        );
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
        items: [LOOK_FIELD.RADIUS_SCALE],
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
      const presetValues = toEffectiveLookWithin(
        { ...VALID_INPUT, logoHue: undefined, radiusScale: RADIUS_SCALE.LG },
        PLAN_ENTITLEMENTS[TENANT_PLAN.FREE],
      );

      const result = await updateLookAction(MOCK_TENANT_ID, {
        ...presetValues,
        logoHue: null,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });
  });

  it('clears the brand name when it is saved blank', async () => {
    await updateLookAction(MOCK_TENANT_ID, { ...VALID_INPUT, brandName: ' ' });

    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      expect.objectContaining({ brandName: null }),
    );
  });

  describe('after a successful save', () => {
    beforeEach(async () => {
      await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);
    });

    it('revalidates the site config', () => {
      expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('stamps when the Look was saved', () => {
      expect(stampSiteConfigSavedAtMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        SITE_CONFIG_SAVED_AT.LOOK,
      );
    });

    it('records a SETTINGS_UPDATED audit event on the site config by the operator', () => {
      expect(insertAuditEventMock).toHaveBeenCalledWith({
        actorId: MOCK_OPERATOR_ID,
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: MOCK_TENANT_ID,
        details: VALID_INPUT,
      });
    });
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

  it.each([
    [LOOK_FIELD.CARD_STYLE, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.FOOTER_LAYOUT, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.HEADER_LAYOUT, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.BUSY_BUTTON_STYLE, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.ACCOUNT_PANEL_STYLE, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.HEADING_WEIGHT, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.HEADING_CASE, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.IMAGE_PROPORTION, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.DIVIDER_WIDTH, MOCK_UNSUPPORTED_LOOK_VALUE],
    [LOOK_FIELD.BRAND_NAME, 'x'.repeat(BRAND_NAME_MAX_LENGTH + 1)],
  ])('rejects an invalid %s without writing it', async (field, value) => {
    const result = await updateLookAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      [field]: value,
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
    expect(stampSiteConfigSavedAtMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('succeeds, revalidates and audits when the stamp fails, logging it once', async () => {
    const stampError = new Error(MOCK_DB_ERROR_MESSAGE);
    stampSiteConfigSavedAtMock.mockRejectedValue(stampError);

    const result = await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(insertAuditEventMock).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.SAVED_AT_STAMP_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        savedAt: SITE_CONFIG_SAVED_AT.LOOK,
        errorName: stampError.name,
      },
    );
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

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockEditorMembershipContext(mockReadyTenant({ id: MOCK_TENANT_ID })),
    );

    await expect(updateLookAction(MOCK_TENANT_ID, VALID_INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('saves for an operator', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOperatorMembershipContext(
        mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      ),
    );

    await expect(
      updateLookAction(MOCK_TENANT_ID, VALID_INPUT),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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
