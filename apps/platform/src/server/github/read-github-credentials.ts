import type { TMaybeUndefined } from '@blog/config';
import { env } from '@platform/utils/env/env';

import { parseGitHubRepo, type TGitHubRepo } from './parse-github-repo';

export type TGitHubCredentials = TGitHubRepo & { token: string };

export const readGitHubCredentials =
  (): TMaybeUndefined<TGitHubCredentials> => {
    const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
    const repo = parseGitHubRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

    return token && repo ? { token, ...repo } : undefined;
  };
