import { HTTP_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_DOMAIN } from '@worker/testing/tenant/fixtures';

import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from './vercel-client';

faker.seed(7017);

const MOCK_BAD_REQUEST_BODY = faker.lorem.sentence();
const { vercelToken, vercelTeamId, vercelWebProjectId } = MOCK_PROVISION_ENV;
const MOCK_PROJECT = {
  token: vercelToken,
  teamId: vercelTeamId,
  projectId: vercelWebProjectId,
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(listVercelProjectDomains, () => {
  it('GETs the project domains list', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ domains: [{ name: MOCK_TENANT_DOMAIN }] }),
        { status: HTTP_STATUS.OK },
      ),
    );

    const result = await listVercelProjectDomains(MOCK_PROJECT);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(result).toEqual([{ name: MOCK_TENANT_DOMAIN }]);
    expect(url).toBe(
      `https://api.vercel.com/v9/projects/${vercelWebProjectId}/domains`,
    );
  });

  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ domains: [] }), { status: HTTP_STATUS.OK }),
    );

    await listVercelProjectDomains(MOCK_PROJECT);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addVercelProjectDomain, () => {
  it('POSTs the domain name to the project', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: MOCK_TENANT_DOMAIN }), {
        status: HTTP_STATUS.OK,
      }),
    );

    await addVercelProjectDomain({
      ...MOCK_PROJECT,
      domain: MOCK_TENANT_DOMAIN,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://api.vercel.com/v10/projects/${vercelWebProjectId}/domains`,
    );
    expect(JSON.parse(init.body as string)).toEqual({
      name: MOCK_TENANT_DOMAIN,
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      new Response(MOCK_BAD_REQUEST_BODY, { status: HTTP_STATUS.BAD_REQUEST }),
    );

    await expect(
      addVercelProjectDomain({ ...MOCK_PROJECT, domain: MOCK_TENANT_DOMAIN }),
    ).rejects.toThrow(`${HTTP_STATUS.BAD_REQUEST} ${MOCK_BAD_REQUEST_BODY}`);
  });
});
