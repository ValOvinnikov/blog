import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
} from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
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

Object.assign(env, { BLOB_READ_WRITE_TOKEN: 'test-token' });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

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
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: 'https://example.blob.vercel-storage.com/email-logo.png',
    });
    upsertEmailConfigMock.mockResolvedValue({});
  });

  it('is a no-op success when the tenant email logo is already unset', async () => {
    getEmailConfigMock.mockResolvedValue(undefined);

    const result = await clearEmailLogoAction('tenant-1', { type: 'tenant' });

    expect(result).toEqual({ ok: true });
    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('clears the tenant email logo and deletes the blob', async () => {
    const result = await clearEmailLogoAction('tenant-1', { type: 'tenant' });

    expect(result).toEqual({ ok: true });
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', {
      logoAssetUrl: null,
    });
    expect(delMock).toHaveBeenCalledWith(
      'https://example.blob.vercel-storage.com/email-logo.png',
      { token: 'test-token' },
    );
  });

  it('clears a per-template logo without touching the tenant email logo', async () => {
    getEmailTemplateMock.mockResolvedValue({
      logoAssetUrl:
        'https://example.blob.vercel-storage.com/email-logo-magic-link.png',
    });
    upsertEmailTemplateMock.mockResolvedValue({});

    const result = await clearEmailLogoAction('tenant-1', {
      type: 'template',
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: null },
    );
    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('records exactly one SETTINGS_UPDATED audit event', async () => {
    await clearEmailLogoAction('tenant-1', { type: 'tenant' });

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: { target: { type: 'tenant' }, operation: 'clear' },
    });
  });

  it('records no audit event when the write itself fails', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await clearEmailLogoAction('tenant-1', { type: 'tenant' });

    expect(result).toEqual({
      ok: false,
      error: "Couldn't remove the logo — try again.",
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      clearEmailLogoAction('tenant-1', { type: 'tenant' }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      clearEmailLogoAction('tenant-1', { type: 'tenant' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });
});
