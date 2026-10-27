import { ERROR_CODE, FINDING_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_NOW,
  mockOpenFindingInput,
  openTestFinding,
} from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { resolveFinding } from './resolve-finding';

faker.seed(6021007);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(resolveFinding, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
  });

  it('marks an open finding resolved and stamps resolvedAt', async () => {
    const opened = await openTestFinding(mockOpenFindingInput({ tenantId }));

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
          mockOpenFindingInput({ tenantId }),
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
