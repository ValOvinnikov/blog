import { HTTP_METHOD } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import { readSignedTenantRequest } from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { z } from 'zod';

import { readInternalPageRequest } from './read-internal-page-request';

const { envMock } = vi.hoisted(() => ({
  envMock: {} as { INTERNAL_PAGES_SECRET?: string },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

vi.mock(
  '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request',
  () => ({ readSignedTenantRequest: vi.fn() }),
);

faker.seed(7181);

const MOCK_SECRET = faker.string.alphanumeric(24);
const MOCK_REQUEST = new Request(faker.internet.url(), {
  method: HTTP_METHOD.POST,
});

const bodySchema = z.object({ tenantId: z.uuid() });

describe(readInternalPageRequest, () => {
  it('reads the request under the internal-pages secret and log events', async () => {
    envMock.INTERNAL_PAGES_SECRET = MOCK_SECRET;

    await readInternalPageRequest(MOCK_REQUEST, bodySchema);

    expect(readSignedTenantRequest).toHaveBeenCalledWith(
      MOCK_REQUEST,
      bodySchema,
      { secret: MOCK_SECRET, log: INTERNAL_PAGES_LOG },
    );
  });
});
