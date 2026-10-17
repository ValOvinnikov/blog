import { faker } from '@faker-js/faker';
import {
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getDbMigrationJournal } from './get-db-migration-journal';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');

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
    github.respond('/contents/packages/db/migrations/meta/_journal.json', () =>
      githubJson({ content }),
    );

    expect(await getDbMigrationJournal(ref)).toEqual({
      ok: true,
      data: entries,
    });
  });

  it('returns githubError when the journal is not valid JSON', async () => {
    const content = Buffer.from('not json').toString('base64');
    github.respond('/contents/packages/db/migrations/meta/_journal.json', () =>
      githubJson({ content }),
    );

    expect(await getDbMigrationJournal(ref)).toEqual({
      ok: false,
      reason: 'githubError',
    });
  });
});
