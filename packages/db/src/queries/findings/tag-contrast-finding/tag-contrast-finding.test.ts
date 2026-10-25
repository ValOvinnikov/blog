import { ERROR_CODE } from '@blog/config/constants';
import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import * as schema from '@blog/db/schema';
import { mockPassingContrastResult } from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { tagContrastFinding } from './tag-contrast-finding';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

function makeTag(): string {
  return `v${faker.system.semver()}`;
}

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(tagContrastFinding, () => {
  it('adds the release tag to the SHA’s contrast finding, keeping its result', async () => {
    const run = mockPassingContrastResult();
    const tag = makeTag();
    await recordContrastResult(run);

    const result = await tagContrastFinding(run.sha, tag);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.details).toEqual({ ...run, tag });
  });

  it('reports DB_NOT_FOUND for a SHA with no contrast run', async () => {
    expect(await tagContrastFinding(faker.git.commitSha(), makeTag())).toEqual({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });
});
