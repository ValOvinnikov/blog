import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  HUE_MIN,
  isAccentHueAccessible,
  LANGUAGE_SWITCHER_STYLE,
  NEXT_NAVIGATION_ERROR,
  PRESET_ID,
  RADIUS_SCALE,
  type TMaybeNull,
} from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { updateLookAction, type TUpdateLookInput } from './update-look-action';

faker.seed(5998);

const { upsertSiteConfigMock, insertAuditEventMock } = vi.hoisted(() => ({
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
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);
const UNSUPPORTED_CARD_STYLE = 'SHADOWED';

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

    it('writes only the preset and accent hue, leaving every Growth-only field stored as it is', async () => {
      const { preset, accentHue } = VALID_INPUT;

      await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        preset,
        accentHue,
      });
    });

    it('audits only what it wrote', async () => {
      const { preset, accentHue } = VALID_INPUT;

      await updateLookAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(insertAuditEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ details: { preset, accentHue } }),
      );
    });
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
