import {
  HTTP_METHOD,
  HTTP_STATUS,
  OPERATOR_ALERT_KIND,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import {
  buildDocumentValidationAlertEmail,
  buildOwnerElevationAlertEmail,
  sendEmail,
} from '@blog/email';
import { faker } from '@faker-js/faker';
import { OPERATOR_ALERT_LOG } from '@platform/constants/operator-alert';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { POST } from './route';

faker.seed(5996);

const { getTenantByIdMock, listSuperadminEmailsMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  listSuperadminEmailsMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    admins: { listSuperadminEmails: listSuperadminEmailsMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: vi.fn(),
}));

const envMock: Partial<Record<keyof typeof env, string>> = env;
const sendEmailMock = vi.mocked(sendEmail);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_ENDPOINT = faker.internet.url();
const MOCK_WRONG_SECRET = faker.string.alphanumeric(24);
const MOCK_FROM_ADDRESS = faker.internet.email();
const MOCK_SUPERADMIN_EMAIL = faker.internet.email();
const MOCK_OTHER_SUPERADMIN_EMAIL = faker.internet.email();
const MOCK_SEND_ERROR = new Error(faker.lorem.sentence());
const MOCK_INVALID_DOCUMENT_COUNT = 3;
const MULTI_STATUS = 207;

const MOCK_TENANT = mockTenant();
const { id: MOCK_TENANT_ID, name: MOCK_TENANT_NAME } = MOCK_TENANT;

const OWNER_ELEVATION_BODY = {
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  tenantId: MOCK_TENANT_ID,
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
};

const OWNER_ELEVATION_EMAIL = buildOwnerElevationAlertEmail({
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
});

const SEND_FAILED_CONTEXT = {
  tenantId: MOCK_TENANT_ID,
  kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
  error: MOCK_SEND_ERROR,
};

const postRawRequest = (
  rawBody: string,
  authorization = `Bearer ${MOCK_BEARER_SECRET}`,
): Request =>
  new Request(MOCK_ENDPOINT, {
    method: HTTP_METHOD.POST,
    headers: { authorization },
    body: rawBody,
  });

const postRequest = (body: unknown, authorization?: string): Request =>
  postRawRequest(JSON.stringify(body), authorization);

describe(POST, () => {
  beforeEach(() => {
    envMock.OPERATOR_ALERT_SECRET = MOCK_BEARER_SECRET;
    envMock.OPERATOR_ALERT_FROM_ADDRESS = MOCK_FROM_ADDRESS;
    getTenantByIdMock.mockResolvedValue(MOCK_TENANT);
    listSuperadminEmailsMock.mockResolvedValue([MOCK_SUPERADMIN_EMAIL]);
  });

  it('rejects a request with the wrong secret', async () => {
    const response = await POST(
      postRequest(OWNER_ELEVATION_BODY, `Bearer ${MOCK_WRONG_SECRET}`),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('logs and returns 500 when the secret is not configured', async () => {
    envMock.OPERATOR_ALERT_SECRET = undefined;

    const response = await POST(postRequest(OWNER_ELEVATION_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      OPERATOR_ALERT_LOG.SECRET_MISSING,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a body that is not valid JSON', '{not valid json'],
    ['an unknown alert kind', JSON.stringify({ kind: faker.lorem.word() })],
  ])('returns 400 for %s', async (_label, rawBody) => {
    const response = await POST(postRawRequest(rawBody));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('returns 404 and sends nothing for an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValueOnce(undefined);

    const response = await POST(
      postRequest({ ...OWNER_ELEVATION_BODY, tenantId: MOCK_OTHER_TENANT_ID }),
    );

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(listSuperadminEmailsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends the owner-elevation alert to every superadmin', async () => {
    listSuperadminEmailsMock.mockResolvedValueOnce([
      MOCK_SUPERADMIN_EMAIL,
      MOCK_OTHER_SUPERADMIN_EMAIL,
    ]);

    const response = await POST(postRequest(OWNER_ELEVATION_BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock.mock.calls).toEqual([
      [
        {
          to: MOCK_SUPERADMIN_EMAIL,
          from: MOCK_FROM_ADDRESS,
          ...OWNER_ELEVATION_EMAIL,
        },
      ],
      [
        {
          to: MOCK_OTHER_SUPERADMIN_EMAIL,
          from: MOCK_FROM_ADDRESS,
          ...OWNER_ELEVATION_EMAIL,
        },
      ],
    ]);
  });

  it('returns 200 and sends nothing when there are no superadmins', async () => {
    listSuperadminEmailsMock.mockResolvedValueOnce([]);

    const response = await POST(postRequest(OWNER_ELEVATION_BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends the document-validation alert for that kind', async () => {
    const response = await POST(
      postRequest({
        kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
        tenantId: MOCK_TENANT_ID,
        invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
        isCritical: true,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: MOCK_SUPERADMIN_EMAIL,
      from: MOCK_FROM_ADDRESS,
      ...buildDocumentValidationAlertEmail({
        tenantName: MOCK_TENANT_NAME,
        tenantId: MOCK_TENANT_ID,
        invalidDocumentCount: MOCK_INVALID_DOCUMENT_COUNT,
        isCritical: true,
      }),
    });
  });

  it('logs a failed send and still sends to the other recipient', async () => {
    listSuperadminEmailsMock.mockResolvedValueOnce([
      MOCK_SUPERADMIN_EMAIL,
      MOCK_OTHER_SUPERADMIN_EMAIL,
    ]);
    sendEmailMock.mockRejectedValueOnce(MOCK_SEND_ERROR);

    const response = await POST(postRequest(OWNER_ELEVATION_BODY));
    const responseBody = await response.json();
    const recipients = sendEmailMock.mock.calls.map(([{ to }]) => to);

    expect(recipients).toEqual([
      MOCK_SUPERADMIN_EMAIL,
      MOCK_OTHER_SUPERADMIN_EMAIL,
    ]);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      OPERATOR_ALERT_LOG.SEND_FAILED,
      SEND_FAILED_CONTEXT,
    );
    expect(response.status).toBe(MULTI_STATUS);
    expect(responseBody).toEqual({ sent: 1, failed: 1 });
  });

  it('logs every failure and returns 502 when every send fails', async () => {
    sendEmailMock.mockRejectedValueOnce(MOCK_SEND_ERROR);

    const response = await POST(postRequest(OWNER_ELEVATION_BODY));

    expect(loggerErrorMock).toHaveBeenCalledWith(
      OPERATOR_ALERT_LOG.SEND_FAILED,
      SEND_FAILED_CONTEXT,
    );
    expect(response.status).toBe(HTTP_STATUS.BAD_GATEWAY);
  });
});
