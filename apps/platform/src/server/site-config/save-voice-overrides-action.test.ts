import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  VOICE_FIELD_ERROR,
} from '@blog/config';
import { LOCALE_ISO_CODES, PRESET_ID } from '@blog/config/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

const {
  getSiteConfigOrDefaultsMock,
  upsertSiteConfigMock,
  revalidateSiteConfigMock,
  loggerErrorMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  getSiteConfigOrDefaultsMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@platform/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@platform/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
  },
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);

const tenant = { id: 'tenant-1' };

const overrides = { notFoundSupportingText: 'Custom 404 copy.' };

const overridesByLocale = {
  [LOCALE_ISO_CODES.EN]: overrides,
  [LOCALE_ISO_CODES.DE]: { ...overrides, notFoundHeading: 'Nicht gefunden' },
};

const savedTheme = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: 28,
  headingFont: 'FRAUNCES',
  bodyFont: 'INTER',
  radiusScale: 'SM',
  density: 'COMPACT',
};

describe(saveVoiceOverridesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    upsertSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    loggerErrorMock.mockReset();
    recordAuditEventMock.mockReset();
    recordAuditEventMock.mockResolvedValue(undefined);
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...savedTheme,
      logoAssetUrl: 'https://blob.example.com/logo.png',
      faviconAssetUrl: 'https://blob.example.com/favicon.png',
    });
    upsertSiteConfigMock.mockResolvedValue({ ok: true });
    requireTenantMembershipMock.mockResolvedValue({
      tenant,
      membership: { role: 'OWNER' },
    });
  });

  it('resolves the tenant from the checked membership, never a bare client-supplied id', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(getSiteConfigOrDefaultsMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ voiceOverridesByLocale: overridesByLocale }),
    );
  });

  it('round-trips the saved theme and never writes the logo or favicon columns', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', {
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
        'tenant-1',
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
      'tenant-1',
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'site_config.voice_save_failed',
      expect.objectContaining({ tenantId: 'tenant-1' }),
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
    upsertSiteConfigMock.mockResolvedValue({ ok: false, fieldErrorsByLocale });

    const result = await saveVoiceOverridesAction(
      'tenant-1',
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
      'tenant-1',
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });

  it('records a SETTINGS_UPDATED audit event on the site config after a confirmed save', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

    expect(recordAuditEventMock).toHaveBeenCalledWith({
      logEvent: 'site_config.voice_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: { voiceOverridesByLocale: overridesByLocale },
    });
  });
});
