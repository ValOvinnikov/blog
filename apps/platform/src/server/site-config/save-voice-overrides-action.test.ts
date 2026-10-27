import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  VOICE_FIELD_ERROR,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  MOCK_THEME_FIELDS,
  mockSiteConfigThemeAndAssets,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

faker.seed(5998);

const { upsertSiteConfigMock, insertAuditEventMock } = vi.hoisted(() => ({
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/server/site-config/site-config-or-defaults');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_DE_HEADING = faker.lorem.words(2);
const MOCK_MAX_LENGTH = faker.number.int({ min: 10, max: 200 });
const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);

const overrides = { notFoundSupportingText: MOCK_SUPPORTING_TEXT };

const overridesByLocale = {
  [LOCALE_ISO_CODES.EN]: overrides,
  [LOCALE_ISO_CODES.DE]: { ...overrides, notFoundHeading: MOCK_DE_HEADING },
};

describe(saveVoiceOverridesAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    vi.mocked(getSiteConfigOrDefaults).mockReset();
    upsertSiteConfigMock.mockReset();
    upsertSiteConfigMock.mockResolvedValue(okResult());
    insertAuditEventMock.mockReset();
  });

  it('resolves the tenant from the checked membership, never a bare client id', async () => {
    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSiteConfigOrDefaults).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('round-trips the saved theme and never writes the logo or favicon columns', async () => {
    vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
      mockSiteConfigThemeAndAssets({
        logoAssetUrl: faker.internet.url(),
        faviconAssetUrl: faker.internet.url(),
      }),
    );

    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...MOCK_THEME_FIELDS,
      voiceOverridesByLocale: overridesByLocale,
    });
  });

  it.each([
    { scenario: 'an unknown locale', payload: { XX: overrides } },
    {
      scenario: 'an unknown field key',
      payload: { [LOCALE_ISO_CODES.EN]: { notAField: MOCK_SUPPORTING_TEXT } },
    },
    {
      scenario: 'a locale entry that is not an object',
      payload: { [LOCALE_ISO_CODES.EN]: MOCK_SUPPORTING_TEXT },
    },
    {
      scenario: 'a payload that is not an object',
      payload: MOCK_SUPPORTING_TEXT,
    },
  ])(
    'rejects $scenario without touching the db or logging a failed save',
    async ({ payload }) => {
      // @ts-expect-error -- each payload is a deliberately malformed voice map
      const result = await saveVoiceOverridesAction(MOCK_TENANT_ID, payload);

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrorsByLocale: {},
      });
      expect(getSiteConfigOrDefaults).not.toHaveBeenCalled();
      expect(upsertSiteConfigMock).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it('reports a server error and logs when the upsert throws', async () => {
    const dbError = new Error(MOCK_DB_ERROR_MESSAGE);
    upsertSiteConfigMock.mockRejectedValue(dbError);

    const result = await saveVoiceOverridesAction(
      MOCK_TENANT_ID,
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.VOICE_SAVE_FAILED,
      { tenantId: MOCK_TENANT_ID, errorName: dbError.name },
    );
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns the rejected fields per language without revalidating', async () => {
    const fieldErrorsByLocale = {
      [LOCALE_ISO_CODES.DE]: {
        notFoundHeading: {
          reason: VOICE_FIELD_ERROR.TOO_LONG,
          values: { max: MOCK_MAX_LENGTH },
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
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('succeeds and revalidates the tenant on a successful save', async () => {
    const result = await saveVoiceOverridesAction(
      MOCK_TENANT_ID,
      overridesByLocale,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('records a SETTINGS_UPDATED audit event on the site config after a confirmed save', async () => {
    await saveVoiceOverridesAction(MOCK_TENANT_ID, overridesByLocale);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { voiceOverridesByLocale: overridesByLocale },
    });
  });
});
