import type { TMaybeNull } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { encodeSignatureHeader } from '@sanity/webhook';
import {
  REVALIDATE_SIGNATURE_MAX_AGE_MS,
  SIGNATURE_REFUSED_REASON,
} from '@web/constants/revalidate';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { verifyRevalidateSignature } from './verify-revalidate-signature';

faker.seed(5722);

const { getTenantRevalidateWebhookSecretMock } = vi.hoisted(() => ({
  getTenantRevalidateWebhookSecretMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantRevalidateWebhookSecret: getTenantRevalidateWebhookSecretMock,
    },
  },
}));

const MOCK_NOW = faker.date.recent().getTime();
const MOCK_RAW_BODY = JSON.stringify({
  _type: 'page_post',
  _id: faker.string.uuid(),
});
const MOCK_SHARED_SECRET = faker.string.alphanumeric(32);
const MOCK_TENANT_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_TENANT_SECRET = faker.string.alphanumeric(32);
const MOCK_TENANT_PROJECT_ID = MOCK_TENANT_SANITY_CONTEXT.projectId;
const MOCK_OTHER_PROJECT_ID = faker.string.alphanumeric(8);
const REFUSED = errorResult(SIGNATURE_REFUSED_REASON);

const sign = (secret: string, timestamp = MOCK_NOW): Promise<string> =>
  encodeSignatureHeader(MOCK_RAW_BODY, timestamp, secret);

const verify = (
  signature: TMaybeNull<string>,
  projectId: TMaybeNull<string> = null,
) =>
  verifyRevalidateSignature({
    rawBody: MOCK_RAW_BODY,
    signature,
    projectId,
    sharedSecret: MOCK_SHARED_SECRET,
    now: MOCK_NOW,
  });

describe(verifyRevalidateSignature, () => {
  beforeEach(() => {
    getTenantRevalidateWebhookSecretMock.mockReset();
    getTenantRevalidateWebhookSecretMock.mockImplementation(
      async (projectId: string) =>
        ({
          [MOCK_TENANT_PROJECT_ID]: {
            tenantId: MOCK_TENANT_ID,
            secret: MOCK_TENANT_SECRET,
          },
          [MOCK_OTHER_PROJECT_ID]: {
            tenantId: MOCK_OTHER_TENANT_ID,
            secret: MOCK_OTHER_TENANT_SECRET,
          },
        })[projectId],
    );
  });

  describe('for a tenant with its own secret', () => {
    it('resolves the tenant for a request signed with its secret', async () => {
      await expect(
        verify(await sign(MOCK_TENANT_SECRET), MOCK_TENANT_PROJECT_ID),
      ).resolves.toEqual(okResult(MOCK_TENANT_ID));
    });

    it("refuses another tenant's signed request resent with its project id", async () => {
      await expect(
        verify(await sign(MOCK_OTHER_TENANT_SECRET), MOCK_TENANT_PROJECT_ID),
      ).resolves.toEqual(REFUSED);
    });

    it('refuses a request signed with the shared secret', async () => {
      await expect(
        verify(await sign(MOCK_SHARED_SECRET), MOCK_TENANT_PROJECT_ID),
      ).resolves.toEqual(REFUSED);
    });
  });

  it('accepts the shared secret for a tenant with no stored secret yet', async () => {
    getTenantRevalidateWebhookSecretMock.mockResolvedValue({
      tenantId: MOCK_TENANT_ID,
      secret: undefined,
    });

    await expect(
      verify(await sign(MOCK_SHARED_SECRET), MOCK_TENANT_PROJECT_ID),
    ).resolves.toEqual(okResult(MOCK_TENANT_ID));
  });

  it('accepts the shared secret, resolving no tenant, for an unowned project', async () => {
    getTenantRevalidateWebhookSecretMock.mockResolvedValue(undefined);

    await expect(
      verify(await sign(MOCK_SHARED_SECRET), MOCK_TENANT_PROJECT_ID),
    ).resolves.toEqual(okResult(undefined));
  });

  it('resolves no tenant and looks none up without a project id', async () => {
    await expect(verify(await sign(MOCK_SHARED_SECRET))).resolves.toEqual(
      okResult(undefined),
    );
    expect(getTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
  });

  it.each([
    ['in the past', -1],
    ['in the future', 1],
  ])(
    'refuses a signature timestamped more than five minutes %s, before any lookup',
    async (_, direction) => {
      const timestamp =
        MOCK_NOW + direction * (REVALIDATE_SIGNATURE_MAX_AGE_MS + 1);

      await expect(
        verify(
          await sign(MOCK_TENANT_SECRET, timestamp),
          MOCK_TENANT_PROJECT_ID,
        ),
      ).resolves.toEqual(REFUSED);
      expect(getTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
    },
  );

  it('accepts a signature exactly five minutes old', async () => {
    const timestamp = MOCK_NOW - REVALIDATE_SIGNATURE_MAX_AGE_MS;

    await expect(
      verify(await sign(MOCK_TENANT_SECRET, timestamp), MOCK_TENANT_PROJECT_ID),
    ).resolves.toEqual(okResult(MOCK_TENANT_ID));
  });

  it.each([
    ['no signature header', null],
    [
      'a signature header not in the t=…,v1=… form',
      faker.string.alphanumeric(24),
    ],
  ])('refuses a request with %s', async (_, signature) => {
    await expect(verify(signature, MOCK_TENANT_PROJECT_ID)).resolves.toEqual(
      REFUSED,
    );
  });

  it('lets a failed tenant lookup reach the caller', async () => {
    const error = new Error(faker.lorem.sentence());
    getTenantRevalidateWebhookSecretMock.mockRejectedValue(error);

    await expect(
      verify(await sign(MOCK_TENANT_SECRET), MOCK_TENANT_PROJECT_ID),
    ).rejects.toBe(error);
  });
});
