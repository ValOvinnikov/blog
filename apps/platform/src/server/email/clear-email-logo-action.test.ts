import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { OPERATOR_EMAIL, OPERATOR_ID } from '@platform/testing/admins/operator';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { clearEmailLogoAction } from './clear-email-logo-action';

const {
  getEmailConfigMock,
  getEmailTemplateMock,
  upsertEmailConfigMock,
  upsertEmailTemplateMock,
  insertAuditEventMock,
  delMock,
} = vi.hoisted(() => ({
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  upsertEmailConfigMock: vi.fn(),
  upsertEmailTemplateMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: {
      getEmailConfig: getEmailConfigMock,
      upsertEmailConfig: upsertEmailConfigMock,
    },
    emailTemplates: {
      getEmailTemplate: getEmailTemplateMock,
      upsertEmailTemplate: upsertEmailTemplateMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('@vercel/blob', () => ({ del: delMock }));

vi.mock('@platform/utils/env/env');

const BLOB_TOKEN = 'test-token';
const TENANT_LOGO_URL =
  'https://example.blob.vercel-storage.com/email-logo.png';

Object.assign(env, { BLOB_READ_WRITE_TOKEN: BLOB_TOKEN });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(clearEmailLogoAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    upsertEmailConfigMock.mockReset();
    upsertEmailTemplateMock.mockReset();
    insertAuditEventMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: TENANT_ID },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: TENANT_LOGO_URL,
    });
    upsertEmailConfigMock.mockResolvedValue({});
  });

  it('is a no-op success when the tenant email logo is already unset', async () => {
    getEmailConfigMock.mockResolvedValue(undefined);

    const result = await clearEmailLogoAction(TENANT_ID, { type: 'tenant' });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('clears the tenant email logo and deletes the blob', async () => {
    const result = await clearEmailLogoAction(TENANT_ID, { type: 'tenant' });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfigMock).toHaveBeenCalledWith(TENANT_ID, {
      logoAssetUrl: null,
    });
    expect(delMock).toHaveBeenCalledWith(TENANT_LOGO_URL, {
      token: BLOB_TOKEN,
    });
  });

  it('clears a per-template logo without touching the tenant email logo', async () => {
    getEmailTemplateMock.mockResolvedValue({
      logoAssetUrl:
        'https://example.blob.vercel-storage.com/email-logo-magic-link.png',
    });
    upsertEmailTemplateMock.mockResolvedValue({});

    const result = await clearEmailLogoAction(TENANT_ID, {
      type: 'template',
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: null },
    );
    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('records exactly one SETTINGS_UPDATED audit event', async () => {
    await clearEmailLogoAction(TENANT_ID, { type: 'tenant' });

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: TENANT_ID,
      details: { target: { type: 'tenant' }, operation: 'clear' },
    });
  });

  it('records no audit event when the write itself fails', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await clearEmailLogoAction(TENANT_ID, { type: 'tenant' });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      clearEmailLogoAction(TENANT_ID, { type: 'tenant' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(
      clearEmailLogoAction(TENANT_ID, { type: 'tenant' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });
});
