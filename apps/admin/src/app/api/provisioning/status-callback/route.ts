import { env } from '@admin/utils/env/env';
import { isSecretMatch } from '@admin/utils/is-secret-match/is-secret-match';
import { logger } from '@admin/utils/logger/logger';
import { ERROR_CODE } from '@blog/config';
import {
  queries,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// `timingSafeEqual` (via `isSecretMatch`) needs Node's crypto module — not
// supported on the Edge runtime.
export const runtime = 'nodejs';

const statusCallbackSchema = z.object({
  tenantId: z.string().min(1),
  step: z.enum(
    Object.values(TENANT_PROVISIONING_STEP) as [
      TTenantProvisioningStep,
      ...TTenantProvisioningStep[],
    ],
  ),
  status: z.enum(
    Object.values(TENANT_PROVISIONING_STEP_STATUS) as [
      TTenantProvisioningStepStatus,
      ...TTenantProvisioningStepStatus[],
    ],
  ),
  error: z.string().optional(),
});

// Only the workflow's last step ever settles the tenant's overall
// `provisioningStatus`. Every earlier step's callback updates only its own
// entry in `provisioningSteps`, regardless of whether it succeeded or
// failed, since a mid-sequence failure is resumable (the admin UI's Retry
// button re-dispatches the workflow, which resumes past whatever already
// succeeded).
const overallStatusFor = (
  step: TTenantProvisioningStep,
  status: TTenantProvisioningStepStatus,
): TTenantProvisioningStatus | undefined => {
  if (step !== TENANT_PROVISIONING_STEP.CREATE_WEBHOOK) return undefined;
  if (status === TENANT_PROVISIONING_STEP_STATUS.DONE) {
    return TENANT_PROVISIONING_STATUS.READY;
  }
  if (status === TENANT_PROVISIONING_STEP_STATUS.FAILED) {
    return TENANT_PROVISIONING_STATUS.FAILED;
  }
  return undefined;
};

/**
 * `POST /api/provisioning/status-callback` — called by the (CI-run)
 * provisioning workflow after every step. Authenticated by a plain bearer
 * token compared against `TENANT_PROVISIONING_CALLBACK_SECRET`, not a signed
 * payload: this callback only ever originates from our own CI runner
 * holding a repo secret, a narrower trust boundary than the Sanity
 * revalidation webhook's HMAC-verified calls from Sanity's own
 * infrastructure.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.TENANT_PROVISIONING_CALLBACK_SECRET;
  if (!secret) {
    logger.error('provisioning.status_callback_secret_missing');
    return NextResponse.json(
      { message: 'Callback secret is not configured.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const parsed = statusCallbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid callback payload.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { tenantId, step, status, error } = parsed.data;

  const result = await queries.tenants.updateProvisioningStep({
    tenantId,
    step,
    status,
    ...(error === undefined ? {} : { error }),
    ...(overallStatusFor(step, status) === undefined
      ? {}
      : { provisioningStatus: overallStatusFor(step, status) }),
  });

  if (!result.ok) {
    logger.error('provisioning.status_callback_update_failed', {
      tenantId,
      step,
      status,
      error: result.error,
    });
    const notFound = result.error === ERROR_CODE.DB_NOT_FOUND;
    return NextResponse.json(
      {
        message: notFound
          ? 'No tenant matches this callback.'
          : 'Failed to record the step update.',
      },
      { status: notFound ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
