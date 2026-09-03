import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './notify-operators';

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
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
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

describe(isNotifiableOutcome, () => {
  it('is true for STALLED and AMBIGUOUS_MEMBERSHIP', () => {
    expect(isNotifiableOutcome('STALLED')).toBe(true);
    expect(isNotifiableOutcome('AMBIGUOUS_MEMBERSHIP')).toBe(true);
  });

  it('is false for ELEVATED, ALREADY_ADMINISTRATOR, PENDING_ACCEPTANCE', () => {
    expect(isNotifiableOutcome('ELEVATED')).toBe(false);
    expect(isNotifiableOutcome('ALREADY_ADMINISTRATOR')).toBe(false);
    expect(isNotifiableOutcome('PENDING_ACCEPTANCE')).toBe(false);
  });
});

describe(notifyOperatorsOfOwnerElevationOutcome, () => {
  it('skips sending when resendApiKey is unset', async () => {
    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant(),
      outcome: 'STALLED',
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

    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant(),
      outcome: 'STALLED',
      resendApiKey: 'resend-key',
    });

    expect(resendCtorMock).toHaveBeenCalledWith('resend-key');
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['super-one@example.com', 'super-two@example.com'],
        subject: expect.stringContaining('Acme'),
      }),
    );
  });

  it('escapes HTML-significant characters in operator-entered tenant fields', async () => {
    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant({ name: '<script>alert(1)</script> & "Co" \'s' }),
      outcome: 'STALLED',
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

    await notifyOperatorsOfOwnerElevationOutcome({
      tenant: tenant(),
      outcome: 'AMBIGUOUS_MEMBERSHIP',
      resendApiKey: 'resend-key',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('swallows a rejected Resend send and resolves without throwing', async () => {
    sendMock.mockRejectedValue(new Error('network down'));

    await expect(
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: 'STALLED',
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
      notifyOperatorsOfOwnerElevationOutcome({
        tenant: tenant(),
        outcome: 'AMBIGUOUS_MEMBERSHIP',
        resendApiKey: 'resend-key',
      }),
    ).resolves.toBeUndefined();
  });
});
