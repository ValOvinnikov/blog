import { faker } from '@faker-js/faker';
import {
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getLatestReleaseTag } from './get-latest-release-tag';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');

const tagRefs = (...tags: string[]) =>
  tags.map((tag) => ({
    ref: `refs/tags/${tag}`,
    object: { sha: faker.git.commitSha() },
  }));

describe(getLatestReleaseTag, () => {
  const github = useGitHubFetch();

  it('returns the numerically greatest release tag', async () => {
    github.respond('/git/matching-refs/tags/v', () =>
      githubJson(tagRefs('v0.9.0', 'v0.10.0', 'v0.2.1')),
    );

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: 'v0.10.0' });
  });

  it('ignores tags that are not release versions', async () => {
    github.respond('/git/matching-refs/tags/v', () =>
      githubJson(tagRefs('v1.0.0', 'v2-beta', 'very-old')),
    );

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: 'v1.0.0' });
  });

  it('returns no tag when the repository has no release tag yet', async () => {
    github.respond('/git/matching-refs/tags/v', () => githubJson([]));

    expect(await getLatestReleaseTag()).toEqual({ ok: true, data: undefined });
  });
});
