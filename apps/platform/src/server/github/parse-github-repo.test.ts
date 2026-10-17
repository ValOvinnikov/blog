import { parseGitHubRepo } from './parse-github-repo';

describe(parseGitHubRepo, () => {
  it('splits an "owner/repo" value into its parts', () => {
    expect(parseGitHubRepo('acme-org/acme-repo')).toEqual({
      owner: 'acme-org',
      repo: 'acme-repo',
    });
  });

  it('returns undefined when the value is undefined', () => {
    expect(parseGitHubRepo(undefined)).toBeUndefined();
  });

  it('returns undefined for a value with no slash', () => {
    expect(parseGitHubRepo('acme-repo')).toBeUndefined();
  });
});
