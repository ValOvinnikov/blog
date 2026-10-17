import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { makePassingContrastResult } from '@blog/db/testing/findings/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { recordContrastResult } from '../record-contrast-result';

import { tagContrastFinding } from './tag-contrast-finding';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

function makeTag(): string {
  return `v${faker.system.semver()}`;
}

afterEach(async () => {
  await db().delete(schema.findings);
});

describe(tagContrastFinding, () => {
  it('adds the release tag to the SHA’s contrast finding, keeping its result', async () => {
    const run = makePassingContrastResult();
    const tag = makeTag();
    await recordContrastResult(run);

    const result = await tagContrastFinding(run.sha, tag);

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({ details: { ...run, tag } }),
    });
  });

  it('reports DB_NOT_FOUND for a SHA with no contrast run', async () => {
    expect(await tagContrastFinding(faker.git.commitSha(), makeTag())).toEqual({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });
});
