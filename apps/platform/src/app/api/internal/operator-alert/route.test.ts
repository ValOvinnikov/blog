import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

const {
  envMock,
  getTenantByIdMock,
  listSuperadminEmailsMock,
  sendEmailMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  envMock: { OPERATOR_ALERT_SECRET: undefined as string | undefined },
  getTenantByIdMock: vi.fn(),
  listSuperadminEmailsMock: vi.fn(),
  sendEmailMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env', () => ({
  get env() {
    return envMock;
  },
}));

vi.mock('@platform/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock, warn: vi.fn() },
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    admins: { listSuperadminEmails: listSuperadminEmailsMock },
  },
}));

vi.mock('@blog/email', async () => {
  const actual =
    await vi.importActual<typeof import('@blog/email')>('@blog/email');
  return {
    ...actual,
    sendEmail: sendEmailMock,
  };
});

const ENDPOINT = 'https://admin.example.com/api/internal/operator-alert';
const VALID_SECRET = 'a-very-secret-value';

const postRequest = (
  body: unknown,
  { authorization }: { authorization?: string } = {
    authorization: `Bearer ${VALID_SECRET}`,
  },
): Request =>
  new Request(ENDPOINT, {
    method: 'POST',
    headers: authorization ? { authorization } : {},
    body: JSON.stringify(body),
  });

describe('POST /api/internal/operator-alert', () => {
  beforeEach(() => {
    envMock.OPERATOR_ALERT_SECRET = VALID_SECRET;
    getTenantByIdMock.mockReset();
    listSuperadminEmailsMock.mockReset().mockResolvedValue([]);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    loggerErrorMock.mockReset();
  });

  it('rejects a request with no Authorization header', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      postRequest(
        { kind: 'OWNER_ELEVATION', tenantId: 't1', outcome: 'STALLED' },
        { authorization: undefined },
      ),
    );

    expect(response.status).toBe(401);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('rejects a request with the wrong secret', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      postRequest(
        { kind: 'OWNER_ELEVATION', tenantId: 't1', outcome: 'STALLED' },
        { authorization: 'Bearer wrong-secret-value' },
      ),
    );

    expect(response.status).toBe(401);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('rejects a secret of a different length', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      postRequest(
        { kind: 'OWNER_ELEVATION', tenantId: 't1', outcome: 'STALLED' },
        { authorization: 'Bearer short' },
      ),
    );

    expect(response.status).toBe(401);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 500 and never calls isSecretMatch when the secret is not configured', async () => {
    envMock.OPERATOR_ALERT_SECRET = undefined;
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    );

    expect(response.status).toBe(500);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed body even with a valid secret', async () => {
    const { POST } = await import('./route');

    const response = await POST(postRequest({ kind: 'NOT_A_REAL_KIND' }));

    expect(response.status).toBe(400);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a body that is not valid JSON, instead of throwing', async () => {
    const { POST } = await import('./route');

    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
      body: '{not valid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 404 and sends nothing for an unknown tenantId', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 'ghost-tenant',
        outcome: 'STALLED',
      }),
    );

    expect(response.status).toBe(404);
    expect(listSuperadminEmailsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends one email per superadmin recipient for a valid OWNER_ELEVATION alert', async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 't1', name: 'Acme' }));
    listSuperadminEmailsMock.mockResolvedValue([
      'super-one@example.com',
      'super-two@example.com',
    ]);
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    );

    expect(response.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'super-one@example.com',
        subject: expect.stringContaining('Acme'),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'super-two@example.com' }),
    );
  });

  it('returns 200 and sends nothing when there are zero superadmins', async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 't1', name: 'Acme' }));
    listSuperadminEmailsMock.mockResolvedValue([]);
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    );

    expect(response.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends the document-validation subject for a valid DOCUMENT_VALIDATION alert', async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 't1', name: 'Acme' }));
    listSuperadminEmailsMock.mockResolvedValue(['super-one@example.com']);
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'DOCUMENT_VALIDATION',
        tenantId: 't1',
        invalidDocumentCount: 3,
        isCritical: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Tenant "Acme" (t1) has invalid Sanity documents',
      }),
    );
  });

  it('logs a failed send and still sends to the other recipient', async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 't1', name: 'Acme' }));
    listSuperadminEmailsMock.mockResolvedValue([
      'super-one@example.com',
      'super-two@example.com',
    ]);
    const sendError = new Error('Failed to send email via Resend: rejected');
    sendEmailMock.mockImplementation(({ to }: { to: string }) =>
      to === 'super-one@example.com'
        ? Promise.reject(sendError)
        : Promise.resolve(undefined),
    );
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    );

    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'super-two@example.com' }),
    );
    expect(loggerErrorMock).toHaveBeenCalledWith('operator_alert.send_failed', {
      tenantId: 't1',
      kind: 'OWNER_ELEVATION',
      error: sendError,
    });
    expect(response.status).toBe(207);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ sent: 1, failed: 1 });
  });

  it('logs every failure and returns 502 when every send fails', async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 't1', name: 'Acme' }));
    listSuperadminEmailsMock.mockResolvedValue(['super-one@example.com']);
    const sendError = new Error('Failed to send email via Resend: rejected');
    sendEmailMock.mockRejectedValue(sendError);
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    );

    expect(loggerErrorMock).toHaveBeenCalledWith('operator_alert.send_failed', {
      tenantId: 't1',
      kind: 'OWNER_ELEVATION',
      error: sendError,
    });
    expect(response.status).toBe(502);
  });
});
