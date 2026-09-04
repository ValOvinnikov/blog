import { OPERATOR_ALERT_KIND } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  buildDocumentValidationAlertEmail,
  buildOwnerElevationAlertEmail,
  sendEmail,
} from '@blog/email';
import { isSecretMatch } from '@blog/utils';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const OPERATOR_ALERT_SCHEMA = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(OPERATOR_ALERT_KIND.OWNER_ELEVATION),
    tenantId: z.string().min(1),
    outcome: z.enum(['STALLED', 'AMBIGUOUS_MEMBERSHIP']),
  }),
  z.object({
    kind: z.literal(OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION),
    tenantId: z.string().min(1),
    invalidDocumentCount: z.number().int().min(0),
    isCritical: z.boolean(),
  }),
]);

/**
 * Inbound, machine-callable alert endpoint — `@blog/db`'s CLI scripts report
 * facts here over a Bearer shared secret, and this app resolves recipients,
 * renders copy, and sends.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.OPERATOR_ALERT_SECRET;
  if (!secret) {
    logger.error('operator_alert.secret_missing');
    return NextResponse.json(
      { message: 'Operator alert secret is not configured.' },
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
      { message: 'Malformed alert body.' },
      { status: 400 },
    );
  }

  const parsed = OPERATOR_ALERT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Malformed alert body.' },
      { status: 400 },
    );
  }

  const tenant = await queries.tenants.getTenantById(parsed.data.tenantId);
  if (!tenant) {
    logger.warn('operator_alert.tenant_not_found', {
      tenantId: parsed.data.tenantId,
    });
    return NextResponse.json({ message: 'Unknown tenant.' }, { status: 404 });
  }

  const recipients = await queries.admins.listSuperadminEmails();
  if (recipients.length === 0) {
    logger.warn('operator_alert.no_recipients', { tenantId: tenant.id });
    return NextResponse.json({ sent: 0 }, { status: 200 });
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

  const fromAddress = resolveOperatorAlertFromAddress(
    env.OPERATOR_ALERT_FROM_ADDRESS,
  );

  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail({ to, from: fromAddress, subject, html })),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  failures.forEach((failure) => {
    logger.error('operator_alert.send_failed', {
      tenantId: tenant.id,
      kind: parsed.data.kind,
      error: failure.reason,
    });
  });

  const sent = recipients.length - failures.length;

  if (failures.length === recipients.length) {
    return NextResponse.json(
      { message: 'Failed to send operator alert email.' },
      { status: 502 },
    );
  }

  if (failures.length > 0) {
    return NextResponse.json(
      { sent, failed: failures.length },
      { status: 207 },
    );
  }

  return NextResponse.json({ sent }, { status: 200 });
}
