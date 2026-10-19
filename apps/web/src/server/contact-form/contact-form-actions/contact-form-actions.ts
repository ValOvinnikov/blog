'use server';

import {
  ACTION_OUTCOME,
  CAPABILITY,
  type TActionResult,
  type TMaybeUndefined,
} from '@blog/config';
import { queries, type schema } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TFieldErrorReason } from '@web/constants/field-error';
import { sendContactNotification } from '@web/server/contact-form/contact-notification-send/contact-notification-send';
import { createPublicWriteGuard } from '@web/server/rate-limit/public-write-guard/public-write-guard';
import { isCapabilityEnabledForTenant } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';
import {
  type TContactField,
  type TContactMessageFields,
  validateContactMessage,
} from '@web/utils/validate-contact-message/validate-contact-message';

const SOURCE_PATH_MAX_LENGTH = 2_048;

export type TContactMessageInput = TContactMessageFields & {
  website: string;
  sourcePath: string;
};

export type TContactRefusal =
  typeof ACTION_OUTCOME.BLOCKED | typeof ACTION_OUTCOME.SERVER_ERROR;

export type TSubmitContactResult = TActionResult<
  TContactRefusal,
  TContactField,
  TFieldErrorReason
>;

const BLOCKED = { outcome: ACTION_OUTCOME.BLOCKED } as const;
const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR } as const;

const { isBotOrUnverified, isRateLimited } = createPublicWriteGuard({
  name: 'contact-form-submit',
  blockedEvent: 'contact_form.submit_blocked',
  windowMs: 10 * 60_000,
  maxRequests: 5,
});

// A server action's arguments arrive from the network, whatever their declared type.
const asText = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const toSourcePath = (sourcePath: string): string =>
  sourcePath.startsWith('/') &&
  !sourcePath.startsWith('//') &&
  sourcePath.length <= SOURCE_PATH_MAX_LENGTH
    ? sourcePath
    : '/';

const isContactFormOpen = async (tenant: TTenant): Promise<boolean> =>
  isTenantActive(tenant) &&
  isCapabilityEnabledForTenant(tenant.id, CAPABILITY.CONTACT_FORM);

const storeLead = async (
  input: queries.leads.TCreateLeadInput,
): Promise<TMaybeUndefined<schema.TLead>> => {
  try {
    return await queries.leads.createLead(input);
  } catch (error) {
    logger.error('contact_form.lead_store_failed', { error });
    return undefined;
  }
};

export const submitContactMessage = async (
  input: TContactMessageInput,
): Promise<TSubmitContactResult> => {
  if (await isBotOrUnverified()) return BLOCKED;

  if (asText(input.website)) {
    logger.warn('contact_form.submit_blocked', { reason: 'honeypot' });
    return BLOCKED;
  }

  const tenant = await resolveRequestTenant();
  if (!tenant) {
    logger.error('contact_form.tenant_unresolved');
    return SERVER_ERROR;
  }

  if (await isRateLimited(tenant.id)) return BLOCKED;

  if (!(await isContactFormOpen(tenant))) {
    logger.warn('contact_form.submit_blocked', { reason: 'unavailable' });
    return BLOCKED;
  }

  const validation = validateContactMessage({
    name: asText(input.name),
    email: asText(input.email),
    message: asText(input.message),
  });
  if (!validation.ok) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: validation.fieldErrors,
    };
  }

  const lead = await storeLead({
    tenantId: tenant.id,
    ...validation.data,
    sourcePath: toSourcePath(asText(input.sourcePath)),
  });
  if (!lead) return SERVER_ERROR;

  try {
    await sendContactNotification(lead);
  } catch (error) {
    logger.error('contact_form.notification_send_failed', {
      leadId: lead.id,
      error,
    });
  }

  return { outcome: ACTION_OUTCOME.SUCCESS };
};
