import type { TMaybeUndefined } from '@blog/config';

export type TGitHubRepo = {
  owner: string;
  repo: string;
};

export const parseGitHubRepo = (
  value: TMaybeUndefined<string>,
): TMaybeUndefined<TGitHubRepo> => {
  if (!value) return undefined;

  const [owner, repo] = value.split('/');
  return owner && repo ? { owner, repo } : undefined;
};
