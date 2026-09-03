import { FINDING_SEVERITY } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { notifyOperatorsOfDocumentValidationFailure } from './notify-operators';

const { listSuperadminEmailsMock } = vi.hoisted(() => ({
  listSuperadminEmailsMock: vi.fn(),
}));
const { sendMock, resendCtorMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  resendCtorMock: vi.fn(),
}));

vi.mock('@blog/db/queries/admins', () => ({
  listSuperadminEmails: listSuperadminEmailsMock,
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
    constructor(key: string | undefined) {
      resendCtorMock(key);
    }
  },
}));

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 't1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  listSuperadminEmailsMock.mockReset().mockResolvedValue(['ops@example.com']);
  sendMock
    .mockReset()
    .mockResolvedValue({ data: { id: 'email_1' }, error: null });
  resendCtorMock.mockReset();
});

describe(notifyOperatorsOfDocumentValidationFailure, () => {
  it('skips sending when resendApiKey is unset', async () => {
    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant(),
      invalidDocumentCount: 2,
      severity: FINDING_SEVERITY.WARNING,
      resendApiKey: undefined,
    });

    expect(listSuperadminEmailsMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends one email to every superadmin when configured', async () => {
    listSuperadminEmailsMock.mockResolvedValue([
      'super-one@example.com',
      'super-two@example.com',
    ]);

    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant(),
      invalidDocumentCount: 3,
      severity: FINDING_SEVERITY.CRITICAL,
      resendApiKey: 'resend-key',
    });

    expect(resendCtorMock).toHaveBeenCalledWith('resend-key');
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['super-one@example.com', 'super-two@example.com'],
        subject: expect.stringContaining('Acme'),
        html: expect.stringContaining('3 document(s)'),
      }),
    );
  });

  it('escapes HTML-significant characters in operator-entered tenant fields', async () => {
    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant({ name: '<script>alert(1)</script> & "Co" \'s' }),
      invalidDocumentCount: 1,
      severity: FINDING_SEVERITY.WARNING,
      resendApiKey: 'resend-key',
    });

    const [call] = sendMock.mock.calls;
    const html = (call as [{ html: string }])[0].html;

    expect(html).not.toContain('<script>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Co&quot; &#39;s',
    );
  });

  it('skips sending when there are no superadmin recipients', async () => {
    listSuperadminEmailsMock.mockResolvedValue([]);

    await notifyOperatorsOfDocumentValidationFailure({
      tenant: tenant(),
      invalidDocumentCount: 1,
      severity: FINDING_SEVERITY.WARNING,
      resendApiKey: 'resend-key',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('swallows a rejected Resend send and resolves without throwing', async () => {
    sendMock.mockRejectedValue(new Error('network down'));

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant: tenant(),
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.WARNING,
        resendApiKey: 'resend-key',
      }),
    ).resolves.toBeUndefined();
  });

  it('swallows a Resend-reported send error and resolves without throwing', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    });

    await expect(
      notifyOperatorsOfDocumentValidationFailure({
        tenant: tenant(),
        invalidDocumentCount: 1,
        severity: FINDING_SEVERITY.CRITICAL,
        resendApiKey: 'resend-key',
      }),
    ).resolves.toBeUndefined();
  });
});
