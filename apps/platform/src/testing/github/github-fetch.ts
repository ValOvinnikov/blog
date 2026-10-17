import { faker } from '@faker-js/faker';
import { env } from '@platform/utils/env/env';

type TGitHubRoute = [pathPrefix: string, response: () => Response];

const envMock: Partial<Record<keyof typeof env, string>> = env;

export const githubJson = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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
      return route ? route[1]() : githubJson({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = `ghp_${faker.string.alphanumeric(36)}`;
    envMock.TENANT_PROVISIONING_GITHUB_REPO = `${owner}/${repo}`;
  });

  return {
    fetchMock,
    respond: (pathPrefix: string, response: () => Response) => {
      routes.unshift([pathPrefix, response]);
    },
    unsetToken: () => {
      envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;
    },
  };
};
