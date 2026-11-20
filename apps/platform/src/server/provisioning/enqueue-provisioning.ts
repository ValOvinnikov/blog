import { WORKER_LOG } from '@platform/constants/worker';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { workerSecretsEnv } from '@platform/utils/worker-secrets-env/worker-secrets-env';
import { HTTP_METHOD, type TMaybeNull } from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';

const PROVISION_PATH = '/api/provision';
// Twice the platform's other outbound calls: the worker admits the row and starts the run before it answers.
const ENQUEUE_TIMEOUT_MS = 10_000;

type TWorkerRequestBody = {
  tenantId: string;
  formerOwnerEmail?: string;
  membershipId?: string;
  memberEmail?: string;
  sanityUserId?: string;
  domain?: string;
  locales?: TLocaleIsoCode[];
  postId?: string;
  claimedAt?: string;
};

type TWorkerSecretName = keyof typeof workerSecretsEnv;

export type TWorkerResponse =
  | { status: number }
  | {
      status: null;
      failureEvent: TValueOf<typeof WORKER_LOG>;
      failure: Record<string, unknown>;
    };

export const isWorkerRequestFailure = (
  response: TWorkerResponse,
): response is Extract<TWorkerResponse, { status: null }> =>
  'failureEvent' in response;

/** Never throws and never logs: a missing worker URL or secret, or a network failure, comes back as the failure to log. */
export const sendWorkerRequest = async (
  path: string,
  body: TWorkerRequestBody,
  secretName: TWorkerSecretName = 'WORKER_ENQUEUE_SECRET',
): Promise<TWorkerResponse> => {
  const workerUrl = env.WORKER_ENQUEUE_URL;
  const secret = workerSecretsEnv[secretName];

  if (!workerUrl || !secret) {
    return {
      status: null,
      failureEvent: WORKER_LOG.ENQUEUE_SKIPPED,
      failure: {
        hasWorkerUrl: Boolean(workerUrl),
        hasSecret: Boolean(secret),
      },
    };
  }

  const url = new URL(path, workerUrl);
  const rawBody = JSON.stringify(body);

  try {
    const response = await fetch(url, {
      method: HTTP_METHOD.POST,
      headers: {
        'Content-Type': 'application/json',
        ...buildEnqueueHeaders({ secret, path: url.pathname, rawBody }),
      },
      body: rawBody,
      signal: AbortSignal.timeout(ENQUEUE_TIMEOUT_MS),
    });
    return { status: response.status };
  } catch (error) {
    return {
      status: null,
      failureEvent: WORKER_LOG.ENQUEUE_ERROR,
      failure: toLoggableError(error),
    };
  }
};

/** Never throws: a missing worker URL or secret, or a network failure, is logged and returns `null`; any response returns its status. */
export const enqueueWorkerRequest = async (
  path: string,
  body: TWorkerRequestBody,
): Promise<TMaybeNull<number>> => {
  const response = await sendWorkerRequest(path, body);

  if (isWorkerRequestFailure(response)) {
    const { failureEvent, failure } = response;
    logger.error(failureEvent, { tenantId: body.tenantId, path, ...failure });
  }
  return response.status;
};

export const enqueueProvisioning = (
  tenantId: string,
): Promise<TMaybeNull<number>> =>
  enqueueWorkerRequest(PROVISION_PATH, { tenantId });
