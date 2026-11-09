import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config';
import {
  COOKIE_STATEMENT_LOG,
  COOKIE_STATEMENT_PATH,
} from '@platform/constants/cookie-statement';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { enqueueCookieStatementSeed } from './enqueue-cookie-statement-seed';

vi.mock('@platform/server/provisioning/enqueue-provisioning');

const enqueueWorkerRequestMock = vi.mocked(enqueueWorkerRequest);

const { EN, NL } = LOCALE_ISO_CODES;

describe(enqueueCookieStatementSeed, () => {
  it('asks the worker to seed the cookie statement in every given language', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(HTTP_STATUS.ACCEPTED);

    await enqueueCookieStatementSeed(MOCK_TENANT_ID, [EN, NL]);

    expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(
      COOKIE_STATEMENT_PATH.SEED,
      { tenantId: MOCK_TENANT_ID, locales: [EN, NL] },
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a request the worker rejects', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(HTTP_STATUS.CONFLICT);

    await enqueueCookieStatementSeed(MOCK_TENANT_ID, [EN]);

    expect(logger.error).toHaveBeenCalledWith(
      COOKIE_STATEMENT_LOG.SEED_ENQUEUE_REJECTED,
      {
        tenantId: MOCK_TENANT_ID,
        locales: [EN],
        responseStatus: HTTP_STATUS.CONFLICT,
      },
    );
  });

  it('leaves an unreachable worker to the request it already logged', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(null);

    await enqueueCookieStatementSeed(MOCK_TENANT_ID, [EN]);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
