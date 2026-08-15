import { env } from '@admin/utils/env/env';
import { sanitizeLogMessage } from '@admin/utils/sanitize-log-message/sanitize-log-message';

export type TDomainVerificationStatus =
  'NOT_CONFIGURED' | 'NOT_ADDED' | 'PENDING' | 'VERIFIED' | 'ERROR';

const VERCEL_TIMEOUT_MS = 5000;

/**
 * Live, non-blocking DNS-verification check against Vercel's Domains API —
 * informational only (the tenant-creation-flow design doc §3: "Finish"
 * never blocks on this). Called fresh on every render of the tenant status
 * page — no polling/cron at this scale, the operator just refreshes.
 */
export async function getDomainVerificationStatus(
  domain: string,
): Promise<TDomainVerificationStatus> {
  const {
    VERCEL_API_TOKEN: token,
    VERCEL_WEB_PROJECT_ID: projectId,
    VERCEL_TEAM_ID: teamId,
  } = env;

  if (!token || !projectId) return 'NOT_CONFIGURED';

  const url = new URL(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`,
  );
  if (teamId) url.searchParams.set('teamId', teamId);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
    });

    if (response.status === 404) return 'NOT_ADDED';

    if (!response.ok) {
      console.error(
        `Vercel domain check responded with ${response.status} for "${domain}".`,
      );
      return 'ERROR';
    }

    const data = (await response.json()) as { verified?: boolean };
    return data.verified ? 'VERIFIED' : 'PENDING';
  } catch (error) {
    console.error(
      'Failed to check domain verification status:',
      sanitizeLogMessage(error),
    );
    return 'ERROR';
  }
}
