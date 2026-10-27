import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const envMock: Partial<Record<keyof typeof env, string>> = env;

const fetchMock = vi.fn();

const MOCK_GITHUB_TOKEN = faker.string.alphanumeric(32);
const MOCK_GITHUB_OWNER = faker.internet.username();
const MOCK_GITHUB_REPO = faker.lorem.slug(2);
const MOCK_DATASET = faker.lorem.word();
const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);
const WORKFLOW_DISPATCH_URL = `https://api.github.com/repos/${MOCK_GITHUB_OWNER}/${MOCK_GITHUB_REPO}/actions/workflows/deprovision-tenant.yml/dispatches`;
const WORKFLOW_REF = 'main';

const DISPATCH_INPUT = {
  tenantId: MOCK_TENANT_ID,
  confirm: MOCK_TENANT_NAME,
  dryRun: true,
};

const dispatchedCall = () => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  const { Authorization } = init.headers as Record<string, string>;

  return { url, method: init.method, Authorization, body: init.body };
};

describe(dispatchDeprovisioningWorkflow, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = MOCK_GITHUB_TOKEN;
    envMock.TENANT_PROVISIONING_GITHUB_REPO = `${MOCK_GITHUB_OWNER}/${MOCK_GITHUB_REPO}`;
    envMock.TENANT_PROVISIONING_DATASET = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    'TENANT_PROVISIONING_GITHUB_TOKEN',
    'TENANT_PROVISIONING_GITHUB_REPO',
  ] as const)(
    'skips the dispatch and returns false without %s',
    async (key) => {
      envMock[key] = undefined;

      const result = await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result).toBe(false);
    },
  );

  it('POSTs a workflow_dispatch with tenantId, confirm and dryRun, and returns true', async () => {
    const result = await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

    expect(dispatchedCall()).toEqual({
      url: WORKFLOW_DISPATCH_URL,
      method: HTTP_METHOD.POST,
      Authorization: `Bearer ${MOCK_GITHUB_TOKEN}`,
      body: JSON.stringify({
        ref: WORKFLOW_REF,
        inputs: {
          tenantId: MOCK_TENANT_ID,
          confirm: MOCK_TENANT_NAME,
          dryRun: 'true',
        },
      }),
    });
    expect(result).toBe(true);
  });

  it('sends environment from TENANT_PROVISIONING_DATASET when configured', async () => {
    envMock.TENANT_PROVISIONING_DATASET = MOCK_DATASET;

    await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

    expect(dispatchedCall().body).toBe(
      JSON.stringify({
        ref: WORKFLOW_REF,
        inputs: {
          tenantId: MOCK_TENANT_ID,
          confirm: MOCK_TENANT_NAME,
          dryRun: 'true',
          environment: MOCK_DATASET,
        },
      }),
    );
  });

  it.each([
    {
      scenario: 'the dispatch responds non-2xx',
      arrange: () =>
        fetchMock.mockResolvedValue(
          new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
        ),
    },
    {
      scenario: 'the request itself fails',
      arrange: () =>
        fetchMock.mockRejectedValue(new Error(MOCK_NETWORK_ERROR_MESSAGE)),
    },
    {
      scenario: 'the request times out',
      arrange: () =>
        fetchMock.mockRejectedValue(
          new DOMException(MOCK_NETWORK_ERROR_MESSAGE, 'TimeoutError'),
        ),
    },
  ])('returns false without throwing when $scenario', async ({ arrange }) => {
    arrange();

    const result = await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

    expect(result).toBe(false);
  });
});
