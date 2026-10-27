import { faker } from '@faker-js/faker';

import { parseGitHubRepo } from './parse-github-repo';

faker.seed(5998);

describe(parseGitHubRepo, () => {
  it('splits an "owner/repo" value into its parts', () => {
    const owner = faker.lorem.slug();
    const repo = faker.lorem.slug();

    expect(parseGitHubRepo(`${owner}/${repo}`)).toEqual({ owner, repo });
  });

  it('returns undefined when the value is undefined', () => {
    expect(parseGitHubRepo(undefined)).toBeUndefined();
  });

  it('returns undefined for a value with no slash', () => {
    expect(parseGitHubRepo(faker.lorem.slug())).toBeUndefined();
  });
});
