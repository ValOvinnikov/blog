import { faker } from '@faker-js/faker';
import { MOCK_EMAIL } from '@shinefold/auth/testing/session-fixtures';
import { HTTP_STATUS } from '@shinefold/config/constants';
import type { Profile } from 'next-auth';

import { GITHUB_USERINFO_WITH_EMAIL_VERIFIED } from './github-userinfo';

const MOCK_ACCESS_TOKEN = faker.string.alphanumeric(40);
const MOCK_OTHER_EMAIL = faker.internet.exampleEmail();
const MOCK_LOGIN = faker.internet.username();

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body));
}

function respondWith(profileEmail: string | null, emails: Response): void {
  fetchMock
    .mockResolvedValueOnce(
      jsonResponse({ login: MOCK_LOGIN, email: profileEmail }),
    )
    .mockResolvedValueOnce(emails);
}

async function requestProfile(): Promise<Profile> {
  const request = GITHUB_USERINFO_WITH_EMAIL_VERIFIED.request;
  if (!request) throw new Error('missing request');

  return request({
    tokens: { access_token: MOCK_ACCESS_TOKEN },
  } as Parameters<typeof request>[0]);
}

describe('GITHUB_USERINFO_WITH_EMAIL_VERIFIED', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the public email and marks it verified when GitHub lists it as verified', async () => {
    respondWith(
      MOCK_EMAIL,
      jsonResponse([
        { email: MOCK_OTHER_EMAIL, primary: true, verified: true },
        { email: MOCK_EMAIL, primary: false, verified: true },
      ]),
    );

    expect(await requestProfile()).toMatchObject({
      login: MOCK_LOGIN,
      email: MOCK_EMAIL,
      email_verified: true,
    });
  });

  it('falls back to the primary email when the profile has no public one', async () => {
    respondWith(
      null,
      jsonResponse([
        { email: MOCK_OTHER_EMAIL, primary: false, verified: true },
        { email: MOCK_EMAIL, primary: true, verified: true },
      ]),
    );

    expect(await requestProfile()).toMatchObject({
      email: MOCK_EMAIL,
      email_verified: true,
    });
  });

  it('marks an email GitHub has not verified as unverified', async () => {
    respondWith(
      null,
      jsonResponse([{ email: MOCK_EMAIL, primary: true, verified: false }]),
    );

    expect(await requestProfile()).toMatchObject({
      email: MOCK_EMAIL,
      email_verified: false,
    });
  });

  it('marks the email unverified when the email list cannot be read', async () => {
    respondWith(
      MOCK_EMAIL,
      new Response(null, { status: HTTP_STATUS.FORBIDDEN }),
    );

    expect(await requestProfile()).toMatchObject({
      email: MOCK_EMAIL,
      email_verified: false,
    });
  });

  it('sends the access token to both GitHub requests', async () => {
    respondWith(MOCK_EMAIL, jsonResponse([]));

    await requestProfile();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toMatchObject({
        Authorization: `Bearer ${MOCK_ACCESS_TOKEN}`,
      });
    }
  });
});
