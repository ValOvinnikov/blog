import { faker } from '@faker-js/faker';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_LEGAL_PAGE_URLS } from '@platform/testing/legal-page-urls';
import { HTTP_STATUS, type THttpStatus } from '@shinefold/config';

import { resolveLegalPageUrls } from './resolve-legal-page-urls';

vi.mock('next/cache', () => ({
  unstable_cache: <TFn>(fn: TFn): TFn => fn,
}));

const MOCK_REDIRECT_URLS = MOCK_LEGAL_PAGE_URLS!;
const { origin: MARKETING_ORIGIN } = new URL(MOCK_REDIRECT_URLS.terms);
const MOCK_TERMS_PATH = `/${faker.lorem.slug()}`;
const MOCK_PRIVACY_PATH = `/${faker.lorem.slug()}`;

const fetchMock = vi.fn();

const redirectTo = (
  location: string,
  status: THttpStatus = HTTP_STATUS.TEMPORARY_REDIRECT,
) => new Response(null, { status, headers: { location } });

const answerEach = (terms: Response, privacy: Response) =>
  fetchMock.mockImplementation(async (url: URL) =>
    url.href === MOCK_REDIRECT_URLS.terms ? terms : privacy,
  );

describe(resolveLegalPageUrls, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links each page at the address its redirect lands on', async () => {
    answerEach(
      redirectTo(MOCK_TERMS_PATH),
      redirectTo(`${MARKETING_ORIGIN}${MOCK_PRIVACY_PATH}`),
    );

    await expect(resolveLegalPageUrls(MOCK_REDIRECT_URLS)).resolves.toEqual({
      terms: `${MARKETING_ORIGIN}${MOCK_TERMS_PATH}`,
      privacy: `${MARKETING_ORIGIN}${MOCK_PRIVACY_PATH}`,
    });
  });

  it('reads the redirect without following it', async () => {
    answerEach(redirectTo(MOCK_TERMS_PATH), redirectTo(MOCK_PRIVACY_PATH));

    await resolveLegalPageUrls(MOCK_REDIRECT_URLS);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ redirect: 'manual' }),
    );
  });

  it.each([
    {
      scenario: 'a redirect off the marketing site',
      response: () => redirectTo(faker.internet.url()),
    },
    {
      scenario: 'an answer that is not a redirect',
      response: () => new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
    },
    {
      scenario: 'a redirect without a location',
      response: () =>
        new Response(null, { status: HTTP_STATUS.TEMPORARY_REDIRECT }),
    },
  ])('keeps the redirect address after $scenario', async ({ response }) => {
    answerEach(response(), redirectTo(MOCK_PRIVACY_PATH));

    await expect(resolveLegalPageUrls(MOCK_REDIRECT_URLS)).resolves.toEqual({
      terms: MOCK_REDIRECT_URLS.terms,
      privacy: `${MARKETING_ORIGIN}${MOCK_PRIVACY_PATH}`,
    });
  });

  it('keeps both redirect addresses when the marketing site is unreachable', async () => {
    fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);

    await expect(resolveLegalPageUrls(MOCK_REDIRECT_URLS)).resolves.toEqual(
      MOCK_REDIRECT_URLS,
    );
  });

  it('has nothing to resolve without legal page links', async () => {
    await expect(resolveLegalPageUrls(undefined)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
