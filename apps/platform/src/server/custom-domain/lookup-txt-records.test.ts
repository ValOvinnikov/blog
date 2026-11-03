import { HTTP_STATUS } from '@blog/config';
import { CUSTOM_DOMAIN_TXT_TYPE } from '@platform/constants/custom-domain';
import { DNS_RCODE, DNS_TYPE } from '@platform/constants/dns';
import { MOCK_CLAIM_TOKEN } from '@platform/testing/custom-domain/fixtures';
import { mockJsonResponse } from '@platform/testing/http/mock-json-response';
import { MOCK_CUSTOM_DOMAIN } from '@platform/testing/tenants/fixtures';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';

import { lookupTxtRecords } from './lookup-txt-records';

const MOCK_NAME = customDomainTxtName(MOCK_CUSTOM_DOMAIN);
const HALF = MOCK_CLAIM_TOKEN.length / 2;

const fetchMock = vi.fn();

const txtAnswer = (data: string) => ({
  name: MOCK_NAME,
  type: DNS_TYPE.TXT,
  TTL: 60,
  data,
});

describe(lookupTxtRecords, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for the TXT records of the name', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ Status: DNS_RCODE.NO_ERROR }),
    );

    await lookupTxtRecords(MOCK_NAME);

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get('name')).toBe(MOCK_NAME);
    expect(url.searchParams.get('type')).toBe(CUSTOM_DOMAIN_TXT_TYPE);
  });

  it.each([
    {
      scenario: 'each TXT value with its quotes stripped',
      body: {
        Status: DNS_RCODE.NO_ERROR,
        Answer: [txtAnswer(`"${MOCK_CLAIM_TOKEN}"`), txtAnswer('"unrelated"')],
      },
      expected: [MOCK_CLAIM_TOKEN, 'unrelated'],
    },
    {
      scenario: 'a value the resolver split into several strings, joined',
      body: {
        Status: DNS_RCODE.NO_ERROR,
        Answer: [
          txtAnswer(
            `"${MOCK_CLAIM_TOKEN.slice(0, HALF)}" "${MOCK_CLAIM_TOKEN.slice(HALF)}"`,
          ),
        ],
      },
      expected: [MOCK_CLAIM_TOKEN],
    },
    {
      scenario: 'no records for answers that are not TXT records',
      body: {
        Status: DNS_RCODE.NO_ERROR,
        Answer: [
          { name: MOCK_NAME, type: DNS_TYPE.CNAME, data: 'other.test.' },
        ],
      },
      expected: [],
    },
    {
      scenario: 'no records for a name that does not exist',
      body: { Status: DNS_RCODE.NXDOMAIN },
      expected: [],
    },
    {
      scenario: 'no records for an answer with no records',
      body: { Status: DNS_RCODE.NO_ERROR },
      expected: [],
    },
  ])('returns $scenario', async ({ body, expected }) => {
    fetchMock.mockResolvedValue(mockJsonResponse(body));

    const records = await lookupTxtRecords(MOCK_NAME);

    expect(records).toEqual(expected);
  });

  it.each([
    {
      scenario: 'the resolver reports a failure',
      response: () => mockJsonResponse({ Status: DNS_RCODE.SERVFAIL }),
    },
    {
      scenario: 'the response is not a 200',
      response: () =>
        mockJsonResponse(
          { Status: DNS_RCODE.NO_ERROR },
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ),
    },
    {
      scenario: 'the body is not the expected JSON',
      response: () => new Response('<html>', { status: HTTP_STATUS.OK }),
    },
  ])('rejects when $scenario', async ({ response }) => {
    fetchMock.mockResolvedValue(response());

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow();
  });

  it('rejects when the request times out', async () => {
    fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow('timed out');
  });
});
