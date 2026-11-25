import { faker } from '@faker-js/faker';
import {
  MOCK_GITHUB_MAIN_BRANCH_PATH,
  MOCK_GITHUB_RELEASE_TAGS_PATH,
  mockGitHubCommit,
  mockGitHubTagRef,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { clearMemoryUnstableCache } from '@platform/testing/memory-unstable-cache';
import { MOCK_RELEASE_LAST_TAG } from '@platform/testing/releases/fixtures';

import { getCandidateComparison } from './get-candidate-comparison';

faker.seed(8072);

vi.mock('@platform/utils/env/env');

vi.mock('next/cache', async () => {
  const { memoryUnstableCache } =
    await import('@platform/testing/memory-unstable-cache');

  return { unstable_cache: memoryUnstableCache };
});

describe(getCandidateComparison, () => {
  const github = useGitHubFetch();
  let headSha: string;
  let tagSha: string;

  const compareRequests = () =>
    github.fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/compare/'),
    );

  beforeEach(async () => {
    clearMemoryUnstableCache();
    headSha = faker.git.commitSha();
    tagSha = faker.git.commitSha();
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse([
        {
          ...mockGitHubTagRef(MOCK_RELEASE_LAST_TAG),
          object: { sha: tagSha },
        },
      ]),
    );
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({ commit: { sha: headSha } }),
    );
    github.respond('/compare/', (path) =>
      mockGitHubCompareResponse(path, [mockGitHubCommit()], []),
    );
    await getCandidateComparison();
  });

  it('compares again when the last tag is repointed at the same head', async () => {
    tagSha = faker.git.commitSha();
    await getCandidateComparison();

    expect(compareRequests()).toHaveLength(2);
  });

  it('serves the comparison from the store while the tag points at the same commit', async () => {
    await getCandidateComparison();

    expect(compareRequests()).toHaveLength(1);
  });
});
