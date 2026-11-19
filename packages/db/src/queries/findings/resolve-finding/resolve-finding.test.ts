import { faker } from '@faker-js/faker';
import { ERROR_CODE, FINDING_STATUS } from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_FINDING_NOW,
  mockOpenFindingInput,
  openTestFinding,
} from '@shinefold/db/testing/findings/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { resolveFinding } from './resolve-finding';

faker.seed(6021007);

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
});

describe(resolveFinding, () => {
  beforeEach(async () => {
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
  });

  it('marks an open finding resolved and stamps resolvedAt', async () => {
    const opened = await openTestFinding(
      mockOpenFindingInput({ tenantId: tenant().id }),
    );

    const result = await resolveFinding(opened.id);

    expect(result).toEqual({
      ok: true,
      data: {
        ...opened,
        status: FINDING_STATUS.RESOLVED,
        resolvedAt: MOCK_FINDING_NOW,
      },
    });
  });

  it.each([
    {
      finding: 'an id that does not exist',
      arrangeId: async () => faker.string.uuid(),
    },
    {
      finding: 'a finding that is already resolved',
      arrangeId: async () => {
        const opened = await openTestFinding(
          mockOpenFindingInput({ tenantId: tenant().id }),
        );
        await resolveFinding(opened.id);

        return opened.id;
      },
    },
  ])('returns DB_NOT_FOUND for $finding', async ({ arrangeId }) => {
    const id = await arrangeId();

    const result = await resolveFinding(id);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
