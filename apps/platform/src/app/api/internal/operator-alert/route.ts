import {
  OPERATOR_ALERT_KIND,
  type TOperatorAlertBody,
  HTTP_STATUS,
} from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME, queries } from '@blog/db';
import {
  buildDocumentValidationAlertEmail,
  buildOwnerElevationAlertEmail,
  sendEmail,
} from '@blog/email';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { OPERATOR_ALERT_LOG } from '@platform/constants/operator-alert';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { hasBearerSecret } from '@platform/server/internal-api/has-bearer-secret';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MALFORMED_BODY_MESSAGE = 'Malformed alert body.';

const operatorAlertBodySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(OPERATOR_ALERT_KIND.OWNER_ELEVATION),
    tenantId: z.string().min(1),
    outcome: z.enum([
      ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
    ]),
  }),
  z.object({
    kind: z.literal(OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION),
    tenantId: z.string().min(1),
    invalidDocumentCount: z.number().int().min(0),
    isCritical: z.boolean(),
  }),
]) satisfies z.ZodType<TOperatorAlertBody>;

/**
 * Inbound, machine-callable alert endpoint — `@blog/db`'s CLI scripts report
 * facts here over a Bearer shared secret, and this app resolves recipients,
 * renders copy, and sends.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.OPERATOR_ALERT_SECRET;
  if (!secret) {
    logger.error(OPERATOR_ALERT_LOG.SECRET_MISSING);
    return NextResponse.json(
      { message: 'Operator alert secret is not configured.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  if (!hasBearerSecret(request, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const parsed = operatorAlertBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const tenant = await queries.tenants.getTenantById(parsed.data.tenantId);
  if (!tenant) {
    logger.warn(OPERATOR_ALERT_LOG.TENANT_NOT_FOUND, {
      tenantId: parsed.data.tenantId,
    });
    return NextResponse.json(
      { message: 'Unknown tenant.' },
      { status: HTTP_STATUS.NOT_FOUND },
    );
  }

  const recipients = await queries.admins.listSuperadminEmails();
  if (!hasArrayGotItems(recipients)) {
    logger.warn(OPERATOR_ALERT_LOG.NO_RECIPIENTS, { tenantId: tenant.id });
    return NextResponse.json({ sent: 0 }, { status: HTTP_STATUS.OK });
  }

  const { subject, html } =
    parsed.data.kind === OPERATOR_ALERT_KIND.OWNER_ELEVATION
      ? buildOwnerElevationAlertEmail({
          tenantName: tenant.name,
          tenantId: tenant.id,
          outcome: parsed.data.outcome,
        })
      : buildDocumentValidationAlertEmail({
          tenantName: tenant.name,
          tenantId: tenant.id,
          invalidDocumentCount: parsed.data.invalidDocumentCount,
          isCritical: parsed.data.isCritical,
        });

  const fromAddress = resolveOperatorAlertFromAddress();

  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail({ to, from: fromAddress, subject, html })),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  failures.forEach((failure) => {
    logger.error(OPERATOR_ALERT_LOG.SEND_FAILED, {
      tenantId: tenant.id,
      kind: parsed.data.kind,
      error: failure.reason,
    });
  });

  const sent = recipients.length - failures.length;

  if (failures.length === recipients.length) {
    return NextResponse.json(
      { message: 'Failed to send operator alert email.' },
      { status: HTTP_STATUS.BAD_GATEWAY },
    );
  }

  if (hasArrayGotItems(failures)) {
    return NextResponse.json(
      { sent, failed: failures.length },
      { status: 207 },
    );
  }

  return NextResponse.json({ sent }, { status: HTTP_STATUS.OK });
}
