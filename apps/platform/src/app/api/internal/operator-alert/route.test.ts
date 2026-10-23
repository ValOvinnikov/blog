import {
  HTTP_METHOD,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

const { getTenantByIdMock, listSuperadminEmailsMock, sendEmailMock } =
  vi.hoisted(() => ({
    getTenantByIdMock: vi.fn(),
    listSuperadminEmailsMock: vi.fn(),
    sendEmailMock: vi.fn(),
  }));

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    admins: { listSuperadminEmails: listSuperadminEmailsMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: sendEmailMock,
}));

const loggerErrorMock = vi.mocked(logger.error);

const ENDPOINT = 'https://admin.example.com/api/internal/operator-alert';
const SUPERADMIN_ONE = 'super-one@example.com';
const SUPERADMIN_TWO = 'super-two@example.com';
const SEND_FAILURE_MESSAGE = 'Failed to send email via Resend: rejected';
const SEND_FAILED_EVENT = 'operator_alert.send_failed';

const postRequest = (
  body: unknown,
  { authorization }: { authorization?: string } = {
    authorization: `Bearer ${MOCK_BEARER_SECRET}`,
  },
): Request =>
  new Request(ENDPOINT, {
    method: HTTP_METHOD.POST,
    headers: authorization ? { authorization } : {},
    body: JSON.stringify(body),
  });

describe('POST /api/internal/operator-alert', () => {
  let POST: typeof import('./route').POST;

  beforeEach(async () => {
    envMock.OPERATOR_ALERT_SECRET = MOCK_BEARER_SECRET;
    getTenantByIdMock.mockReset();
    listSuperadminEmailsMock.mockReset().mockResolvedValue([]);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    loggerErrorMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant({ id: 't1', name: 'Acme' }));
    ({ POST } = await import('./route'));
  });

  it('rejects a request with the wrong secret', async () => {
    const response = await POST(
      postRequest(
        {
          kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
          tenantId: 't1',
          outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        },
        { authorization: 'Bearer wrong-secret-value' },
      ),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 500 and never calls isSecretMatch when the secret is not configured', async () => {
    envMock.OPERATOR_ALERT_SECRET = undefined;

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 't1',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed body even with a valid secret', async () => {
    const response = await POST(postRequest({ kind: 'NOT_A_REAL_KIND' }));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a body that is not valid JSON, instead of throwing', async () => {
    const request = new Request(ENDPOINT, {
      method: HTTP_METHOD.POST,
      headers: { authorization: `Bearer ${MOCK_BEARER_SECRET}` },
      body: '{not valid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 404 and sends nothing for an unknown tenantId', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 'ghost-tenant',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(listSuperadminEmailsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends one email per superadmin recipient for a valid OWNER_ELEVATION alert', async () => {
    listSuperadminEmailsMock.mockResolvedValue([
      SUPERADMIN_ONE,
      SUPERADMIN_TWO,
    ]);

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 't1',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: SUPERADMIN_ONE,
        subject: expect.stringContaining('Acme'),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: SUPERADMIN_TWO }),
    );
  });

  it('returns 200 and sends nothing when there are zero superadmins', async () => {
    listSuperadminEmailsMock.mockResolvedValue([]);

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 't1',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends the document-validation subject for a valid DOCUMENT_VALIDATION alert', async () => {
    listSuperadminEmailsMock.mockResolvedValue([SUPERADMIN_ONE]);

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: 't1',
        invalidDocumentCount: 3,
        isCritical: true,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Tenant "Acme" (t1) has invalid Sanity documents',
      }),
    );
  });

  it('logs a failed send and still sends to the other recipient', async () => {
    listSuperadminEmailsMock.mockResolvedValue([
      SUPERADMIN_ONE,
      SUPERADMIN_TWO,
    ]);
    const sendError = new Error(SEND_FAILURE_MESSAGE);
    sendEmailMock.mockImplementation(({ to }: { to: string }) =>
      to === SUPERADMIN_ONE
        ? Promise.reject(sendError)
        : Promise.resolve(undefined),
    );

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 't1',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: SUPERADMIN_TWO }),
    );
    expect(loggerErrorMock).toHaveBeenCalledWith(SEND_FAILED_EVENT, {
      tenantId: 't1',
      kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
      error: sendError,
    });
    expect(response.status).toBe(207);
    const responseBody = await response.json();
    expect(responseBody).toEqual({ sent: 1, failed: 1 });
  });

  it('logs every failure and returns 502 when every send fails', async () => {
    listSuperadminEmailsMock.mockResolvedValue([SUPERADMIN_ONE]);
    const sendError = new Error(SEND_FAILURE_MESSAGE);
    sendEmailMock.mockRejectedValue(sendError);

    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: 't1',
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
    );

    expect(loggerErrorMock).toHaveBeenCalledWith(SEND_FAILED_EVENT, {
      tenantId: 't1',
      kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
      error: sendError,
    });
    expect(response.status).toBe(HTTP_STATUS.BAD_GATEWAY);
  });
});
