import { faker } from '@faker-js/faker';
import { ERROR_CODE } from '@shinefold/config/constants';
import { recordContrastResult } from '@shinefold/db/queries/findings/record-contrast-result';
import * as schema from '@shinefold/db/schema';
import {
  mockPassingContrastResult,
  mockReleaseTag,
} from '@shinefold/db/testing/findings/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { tagContrastFinding } from './tag-contrast-finding';

faker.seed(6021004);

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(tagContrastFinding, () => {
  it('adds the release tag to a SHA’s contrast finding, keeping its result', async () => {
    const run = mockPassingContrastResult();
    const tag = mockReleaseTag();
    await recordContrastResult(run);

    const result = await tagContrastFinding(run.sha, tag);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.details).toEqual({ ...run, tag });
  });

  it('reports DB_NOT_FOUND for a SHA with no contrast run', async () => {
    const result = await tagContrastFinding(
      faker.git.commitSha(),
      mockReleaseTag(),
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
