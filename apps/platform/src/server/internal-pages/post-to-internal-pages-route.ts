import 'server-only';

import { env } from '@platform/utils/env/env';
import { webSecretsEnv } from '@platform/utils/web-secrets-env/web-secrets-env';
import { HTTP_METHOD } from '@shinefold/config';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';

const INTERNAL_PAGES_TIMEOUT_MS = 5000;

const INTERNAL_PAGES_BASE_PATH = '/api/internal/pages';

export const internalPagesRoutes = {
  title: (documentId: string) =>
    `${INTERNAL_PAGES_BASE_PATH}/${encodeURIComponent(documentId)}`,
  path: (documentId: string) =>
    `${INTERNAL_PAGES_BASE_PATH}/${encodeURIComponent(documentId)}/path`,
} as const;

export type TInternalPagesResponse =
  | { isConfigured: true; response: Response }
  | { isConfigured: false; hasWebAppUrl: boolean; hasSecret: boolean };

export const postToInternalPagesRoute = async (
  routePath: string,
  body: Record<string, unknown>,
): Promise<TInternalPagesResponse> => {
  const { WEB_APP_URL: webAppUrl } = env;
  const { INTERNAL_PAGES_SECRET: secret } = webSecretsEnv;

  if (!webAppUrl || !secret) {
    return {
      isConfigured: false,
      hasWebAppUrl: Boolean(webAppUrl),
      hasSecret: Boolean(secret),
    };
  }

  const url = new URL(routePath, webAppUrl);
  const rawBody = JSON.stringify(body);
  const response = await fetch(url, {
    method: HTTP_METHOD.POST,
    headers: {
      'Content-Type': 'application/json',
      ...buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
    },
    body: rawBody,
    signal: AbortSignal.timeout(INTERNAL_PAGES_TIMEOUT_MS),
  });

  return { isConfigured: true, response };
};
