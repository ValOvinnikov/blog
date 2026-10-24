import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  VOICE_FIELD_ERROR,
} from '@blog/config';
import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import { errorResult, okResult } from '@blog/utils';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

const {
  getSiteConfigOrDefaultsMock,
  upsertSiteConfigMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  getSiteConfigOrDefaultsMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
  },
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);

const tenant = { id: MOCK_TENANT_ID };

const overrides = { notFoundSupportingText: 'Custom 404 copy.' };

const overridesByLocale = {
  [LOCALE_ISO_CODES.EN]: overrides,
  [LOCALE_ISO_CODES.DE]: { ...overrides, notFoundHeading: 'Nicht gefunden' },
};

const savedTheme = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: 28,
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.SM,
  density: DENSITY.COMPACT,
};

const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);
const loggerErrorMock = vi.mocked(logger.error);

describe(saveVoiceOverridesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    upsertSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    recordAuditEventMock.mockReset();
    recordAuditEventMock.mockResolvedValue(undefined);
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...savedTheme,
      logoAssetUrl: 'https://blob.example.com/logo.png',
      faviconAssetUrl: 'https://blob.example.com/favicon.png',
    });
    upsertSiteConfigMock.mockResolvedValue(okResult());
    requireTenantMembershipMock.mockResolvedValue({
      tenant,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
  });

  it('resolves the tenant from the checked membership, never a bare client-supplied id', async () => {
    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSiteConfigOrDefaultsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      expect.objectContaining({ voiceOverridesByLocale: overridesByLocale }),
    );
  });

  it('round-trips the saved theme and never writes the logo or favicon columns', async () => {
    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...savedTheme,
      voiceOverridesByLocale: overridesByLocale,
    });
  });

  it.each([
    ['an unknown locale', { XX: overrides }],
    ['an unknown field key', { [LOCALE_ISO_CODES.EN]: { notAField: 'x' } }],
    ['a locale entry that is not an object', { [LOCALE_ISO_CODES.EN]: 'x' }],
    ['a payload that is not an object', 'x'],
  ])(
    'rejects %s without touching the db or logging a failed save',
    async (_, payload) => {
      const result = await saveVoiceOverridesAction(
        MOCK_TENANT_ID,
        payload as TVoiceOverridesByLocaleInput,
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {},
      });
      expect(getSiteConfigOrDefaultsMock).not.toHaveBeenCalled();
      expect(upsertSiteConfigMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it('reports a server error and logs when the upsert throws', async () => {
    upsertSiteConfigMock.mockRejectedValue(new Error('db down'));

    const result = await saveVoiceOverridesAction(
      MOCK_TENANT_ID,
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.VOICE_SAVE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns the rejected fields per language without revalidating', async () => {
    const fieldErrorsByLocale = {
      [LOCALE_ISO_CODES.DE]: {
        notFoundHeading: {
          reason: VOICE_FIELD_ERROR.TOO_LONG,
          values: { max: 100 },
        },
      },
    };
    upsertSiteConfigMock.mockResolvedValue(errorResult(fieldErrorsByLocale));

    const result = await saveVoiceOverridesAction(
      MOCK_TENANT_ID,
      overridesByLocale,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrorsByLocale,
    });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('succeeds and revalidates once on a successful save', async () => {
    const result = await saveVoiceOverridesAction(
      MOCK_TENANT_ID,
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });

  it('records a SETTINGS_UPDATED audit event on the site config after a confirmed save', async () => {
    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(recordAuditEventMock).toHaveBeenCalledWith({
      logEvent: SITE_CONFIG_LOG.VOICE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { voiceOverridesByLocale: overridesByLocale },
    });
  });
});
