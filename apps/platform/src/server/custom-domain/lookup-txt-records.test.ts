import { HTTP_STATUS } from '@blog/config';
import { CUSTOM_DOMAIN_TXT_TYPE } from '@platform/constants/custom-domain';
import { DNS_RCODE, DNS_TYPE } from '@platform/constants/dns';
import { MOCK_CLAIM_TOKEN } from '@platform/testing/custom-domain/fixtures';
import { MOCK_CUSTOM_DOMAIN } from '@platform/testing/tenants/fixtures';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';

import { lookupTxtRecords } from './lookup-txt-records';

const MOCK_NAME = customDomainTxtName(MOCK_CUSTOM_DOMAIN);

const fetchMock = vi.fn();

const dohResponse = (body: unknown, status: number = HTTP_STATUS.OK) =>
  new Response(JSON.stringify(body), { status });

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
    fetchMock.mockResolvedValue(dohResponse({ Status: DNS_RCODE.NO_ERROR }));

    await lookupTxtRecords(MOCK_NAME);

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get('name')).toBe(MOCK_NAME);
    expect(url.searchParams.get('type')).toBe(CUSTOM_DOMAIN_TXT_TYPE);
  });

  it('returns each TXT value with its quotes stripped', async () => {
    fetchMock.mockResolvedValue(
      dohResponse({
        Status: DNS_RCODE.NO_ERROR,
        Answer: [txtAnswer(`"${MOCK_CLAIM_TOKEN}"`), txtAnswer('"unrelated"')],
      }),
    );

    const records = await lookupTxtRecords(MOCK_NAME);

    expect(records).toEqual([MOCK_CLAIM_TOKEN, 'unrelated']);
  });

  it('joins a value the resolver split into several strings', async () => {
    const half = MOCK_CLAIM_TOKEN.length / 2;
    fetchMock.mockResolvedValue(
      dohResponse({
        Status: DNS_RCODE.NO_ERROR,
        Answer: [
          txtAnswer(
            `"${MOCK_CLAIM_TOKEN.slice(0, half)}" "${MOCK_CLAIM_TOKEN.slice(half)}"`,
          ),
        ],
      }),
    );

    const records = await lookupTxtRecords(MOCK_NAME);

    expect(records).toEqual([MOCK_CLAIM_TOKEN]);
  });

  it('ignores answers that are not TXT records', async () => {
    fetchMock.mockResolvedValue(
      dohResponse({
        Status: DNS_RCODE.NO_ERROR,
        Answer: [
          { name: MOCK_NAME, type: DNS_TYPE.CNAME, data: 'other.test.' },
        ],
      }),
    );

    const records = await lookupTxtRecords(MOCK_NAME);

    expect(records).toEqual([]);
  });

  it.each([
    ['a name that does not exist', { Status: DNS_RCODE.NXDOMAIN }],
    ['an answer with no records', { Status: DNS_RCODE.NO_ERROR }],
  ])('returns no records for %s', async (_name, body) => {
    fetchMock.mockResolvedValue(dohResponse(body));

    const records = await lookupTxtRecords(MOCK_NAME);

    expect(records).toEqual([]);
  });

  it('rejects when the resolver reports a failure', async () => {
    fetchMock.mockResolvedValue(dohResponse({ Status: DNS_RCODE.SERVFAIL }));

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow();
  });

  it('rejects on a non-200 response', async () => {
    fetchMock.mockResolvedValue(
      dohResponse(
        { Status: DNS_RCODE.NO_ERROR },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow();
  });

  it('rejects on a body that is not the expected JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>', { status: HTTP_STATUS.OK }),
    );

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow();
  });

  it('rejects when the request times out', async () => {
    fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));

    await expect(lookupTxtRecords(MOCK_NAME)).rejects.toThrow('timed out');
  });
});
