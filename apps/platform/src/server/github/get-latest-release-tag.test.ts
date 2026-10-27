import { faker } from '@faker-js/faker';
import { RELEASE_FAILURE } from '@platform/constants/release';
import { MOCK_GITHUB_RELEASE_TAGS_PATH } from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  mockGitHubPage,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getLatestReleaseTag } from './get-latest-release-tag';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const tagRefs = (...tags: string[]) =>
  tags.map((tag) => ({
    ref: `refs/tags/${tag}`,
    object: { sha: faker.git.commitSha() },
  }));

describe(getLatestReleaseTag, () => {
  const github = useGitHubFetch();

  it('returns the numerically greatest release tag', async () => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse(tagRefs('v0.9.0', 'v0.10.0', 'v0.2.1')),
    );

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: 'v0.10.0' });
  });

  it('finds the greatest version among more tags than GitHub lists by default', async () => {
    const tags = Array.from({ length: 40 }, (_, index) => `v1.${index}.0`);
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, (path) =>
      mockGitHubResponse(mockGitHubPage(tagRefs(...tags), path)),
    );

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: 'v1.39.0' });
  });

  it('reads every page of release tags', async () => {
    const tags = Array.from({ length: 150 }, (_, index) => `v2.${index}.0`);
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, (path) =>
      mockGitHubResponse(mockGitHubPage(tagRefs(...tags), path)),
    );

    expect(await getLatestReleaseTag()).toEqual({
      ok: true,
      data: 'v2.149.0',
    });
  });

  it('reports the read as incomplete when the list is still full at the page cap', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => `v3.${index}.0`);
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse(tagRefs(...fullPage)),
    );

    expect(await getLatestReleaseTag()).toEqual({
      ok: false,
      error: RELEASE_FAILURE.TAG_LIST_INCOMPLETE,
    });
    expect(github.fetchMock).toHaveBeenCalledTimes(10);
  });

  it('ignores tags that are not release versions', async () => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse(tagRefs('v1.0.0', 'v2-beta', 'very-old')),
    );

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: 'v1.0.0' });
  });

  it('returns no tag when the repository has no release tag yet', async () => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () => mockGitHubResponse([]));

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: undefined });
  });
});
