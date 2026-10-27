import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import { MOCK_GITHUB_DB_JOURNAL_PATH } from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getDbMigrationJournal } from './get-db-migration-journal';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const MOCK_JOURNAL_TAG = `${faker.string.numeric(4)}_${faker.lorem.slug()}`;
const MOCK_REF = faker.git.commitSha();

describe(getDbMigrationJournal, () => {
  const github = useGitHubFetch();

  it('returns the journal entries at the ref', async () => {
    const entries = [{ tag: MOCK_JOURNAL_TAG, when: faker.number.int() }];
    const content = Buffer.from(
      JSON.stringify({ version: '7', entries }),
    ).toString('base64');
    github.respond(MOCK_GITHUB_DB_JOURNAL_PATH, () =>
      mockGitHubResponse({ content }),
    );

    expect(await getDbMigrationJournal(MOCK_REF)).toEqual({
      ok: true,
      data: entries,
    });
  });

  it('returns GITHUB_ERROR when the journal is not valid JSON', async () => {
    const content = Buffer.from(faker.lorem.word()).toString('base64');
    github.respond(MOCK_GITHUB_DB_JOURNAL_PATH, () =>
      mockGitHubResponse({ content }),
    );

    expect(await getDbMigrationJournal(MOCK_REF)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
  });
});
