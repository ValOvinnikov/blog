import { seedPlainPersonalDataRows } from '@blog/db/testing/backfill-personal-data/fixtures';
import { deleteTestPersonalDataRows } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { countPersonalDataGaps } from './count-personal-data-gaps';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

beforeEach(async () => {
  await seedPlainPersonalDataRows(db());
});

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(countPersonalDataGaps, () => {
  it('counts the rows with a plain value but no encrypted form or index', async () => {
    const gaps = await countPersonalDataGaps();

    expect(gaps).toEqual({
      users: 1,
      subscribers: 1,
      membership_invites: 1,
      leads: 1,
    });
  });
});
