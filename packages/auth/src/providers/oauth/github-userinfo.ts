import 'server-only';

import type { TokenSet } from '@auth/core/types';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { UserinfoEndpointHandler } from 'next-auth/providers';
import type { GitHubEmail, GitHubProfile } from 'next-auth/providers/github';

const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_USER_EMAILS_URL = `${GITHUB_USER_URL}/emails`;
// GitHub's API refuses a request without a User-Agent.
const GITHUB_USER_AGENT = 'authjs';

async function fetchGitHub(
  url: string,
  accessToken: TMaybeUndefined<string>,
): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': GITHUB_USER_AGENT,
    },
  });
}

async function fetchGitHubEmails(
  accessToken: TMaybeUndefined<string>,
): Promise<GitHubEmail[]> {
  const response = await fetchGitHub(GITHUB_USER_EMAILS_URL, accessToken);
  return response.ok ? ((await response.json()) as GitHubEmail[]) : [];
}

export const GITHUB_USERINFO_WITH_EMAIL_VERIFIED: UserinfoEndpointHandler = {
  request: async ({ tokens: { access_token } }: { tokens: TokenSet }) => {
    const [profile, emails] = await Promise.all([
      fetchGitHub(GITHUB_USER_URL, access_token).then(
        async (response) => (await response.json()) as GitHubProfile,
      ),
      fetchGitHubEmails(access_token),
    ]);
    const email =
      profile.email ?? emails.find(({ primary }) => primary)?.email ?? null;

    return {
      ...profile,
      email,
      email_verified: emails.some(
        (entry) => entry.email === email && entry.verified,
      ),
    };
  },
};
