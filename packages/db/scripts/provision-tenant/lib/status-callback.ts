import type {
  TTenantProvisioningStep,
  TTenantProvisioningStepStatus,
} from '@blog/db/constants';

import { sanitizeLogMessage } from './sanitize-log-message';

const CALLBACK_TIMEOUT_MS = 10_000;

export type TReportStepStatusInput = {
  baseUrl: string;
  secret: string;
  tenantId: string;
  step: TTenantProvisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
};

/**
 * Best-effort `POST /api/provisioning/status-callback` after every step,
 * both on success and failure. Never throws: a callback failure (network
 * error, non-2xx response) must not mask the underlying step result the
 * workflow already logged and is about to act on — it's logged here and
 * swallowed, same stance as `dispatchProvisioningWorkflow` on the admin side.
 */
export async function reportStepStatus(
  input: TReportStepStatusInput,
): Promise<void> {
  const { baseUrl, secret, tenantId, step, status, error } = input;
  const url = new URL('/api/provisioning/status-callback', baseUrl).toString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        step,
        status,
        ...(error === undefined ? {} : { error }),
      }),
      signal: AbortSignal.timeout(CALLBACK_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `status-callback: responded with ${response.status} for tenant "${tenantId}" step "${step}".`,
      );
    }
  } catch (caught) {
    console.error(
      `status-callback: failed to report "${step}"/"${status}" for tenant "${tenantId}":`,
      sanitizeLogMessage(caught),
    );
  }
}
