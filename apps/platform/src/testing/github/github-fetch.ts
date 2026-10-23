import { faker } from '@faker-js/faker';
import { env } from '@platform/utils/env/env';

type TGitHubRoute = [pathPrefix: string, response: (path: string) => Response];

const envMock: Partial<Record<keyof typeof env, string>> = env;

export const mockGitHubResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const GITHUB_DEFAULT_PER_PAGE = 30;
const GITHUB_COMPARE_FILE_LIMIT = 300;

export const mockGitHubPage = <T>(items: T[], path: string): T[] => {
  const params = new URL(path, 'https://api.github.com').searchParams;
  const perPage = Number(params.get('per_page') ?? GITHUB_DEFAULT_PER_PAGE);
  const page = Number(params.get('page') ?? 1);
  return items.slice((page - 1) * perPage, page * perPage);
};

export const mockGitHubCompareResponse = (
  path: string,
  commits: unknown[],
  files: unknown[],
): Response =>
  mockGitHubResponse({
    total_commits: commits.length,
    commits: mockGitHubPage(commits, path),
    files: mockGitHubPage(files.slice(0, GITHUB_COMPARE_FILE_LIMIT), path),
  });

/** Needs `vi.mock('@platform/utils/env/env')` in the calling test file. */
export const useGitHubFetch = () => {
  const fetchMock = vi.fn();
  const owner = faker.lorem.slug();
  const repo = faker.lorem.slug();
  let routes: TGitHubRoute[] = [];

  beforeEach(() => {
    routes = [];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      const path = url.replace(
        `https://api.github.com/repos/${owner}/${repo}`,
        '',
      );
      const route = routes.find(([prefix]) => path.startsWith(prefix));
      return route ? route[1](path) : mockGitHubResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = `ghp_${faker.string.alphanumeric(36)}`;
    envMock.TENANT_PROVISIONING_GITHUB_REPO = `${owner}/${repo}`;
  });

  return {
    fetchMock,
    respond: (pathPrefix: string, response: (path: string) => Response) => {
      routes.unshift([pathPrefix, response]);
    },
    unsetToken: () => {
      envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;
    },
  };
};
