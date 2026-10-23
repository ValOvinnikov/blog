import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import {
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getDbMigrationJournal } from './get-db-migration-journal';

vi.mock('@platform/utils/env/env');

const JOURNAL_PATH = '/contents/packages/db/migrations/meta/_journal.json';

describe(getDbMigrationJournal, () => {
  const github = useGitHubFetch();
  const ref = faker.git.commitSha();

  it('returns the journal entries at the ref', async () => {
    const entries = [
      { tag: '0042_add_things', when: faker.date.recent().getTime() },
    ];
    const content = Buffer.from(
      JSON.stringify({ version: '7', entries }),
    ).toString('base64');
    github.respond(JOURNAL_PATH, () => githubJson({ content }));

    expect(await getDbMigrationJournal(ref)).toEqual({
      ok: true,
      data: entries,
    });
  });

  it('returns GITHUB_ERROR when the journal is not valid JSON', async () => {
    const content = Buffer.from('not json').toString('base64');
    github.respond(JOURNAL_PATH, () => githubJson({ content }));

    expect(await getDbMigrationJournal(ref)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
  });
});
