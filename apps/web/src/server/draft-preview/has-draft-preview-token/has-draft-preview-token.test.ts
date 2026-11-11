import { faker } from '@faker-js/faker';
import { PREVIEW_TOKEN_HEADER } from '@web/server/draft-preview/constants/constants';
import { mintPreviewToken } from '@web/server/draft-preview/preview-token/preview-token';
import { env } from '@web/utils/env/env';

import { hasDraftPreviewToken } from './has-draft-preview-token';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('@web/utils/env/env');

faker.seed(7180);

const MOCK_TENANT_ID = faker.string.uuid();

const sendHeaders = (entries: Record<string, string>): void => {
  headersMock.mockResolvedValue(new Headers(entries));
};

const mintFor = (tenantId: string): string =>
  mintPreviewToken({
    tenantId,
    path: `/${faker.lorem.slug()}`,
    expiresAt: Date.now() + 60_000,
  });

beforeEach(() => {
  Object.assign(env, { PREVIEW_LINK_SECRET: faker.string.alphanumeric(32) });
});

describe(hasDraftPreviewToken, () => {
  it("accepts a valid token for the request's tenant", async () => {
    sendHeaders({ [PREVIEW_TOKEN_HEADER]: mintFor(MOCK_TENANT_ID) });

    await expect(hasDraftPreviewToken(MOCK_TENANT_ID)).resolves.toBe(true);
  });

  it('rejects a valid token for another tenant', async () => {
    sendHeaders({ [PREVIEW_TOKEN_HEADER]: mintFor(faker.string.uuid()) });

    await expect(hasDraftPreviewToken(MOCK_TENANT_ID)).resolves.toBe(false);
  });

  it('rejects a request without a token', async () => {
    sendHeaders({});

    await expect(hasDraftPreviewToken(MOCK_TENANT_ID)).resolves.toBe(false);
  });
});
