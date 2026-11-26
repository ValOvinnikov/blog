import 'server-only';

import {
  ACTION_OUTCOME,
  CAPABILITY,
  type TActionResult,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries, type schema } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isString } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { CONTACT_FORM_LOG } from '@web/constants/contact-form';
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

export type TContactMessageSource = {
  sourceDocumentId: TMaybeUndefined<string>;
  sourceLocale: TLocaleIsoCode;
};

export type TContactRefusal =
  typeof ACTION_OUTCOME.BLOCKED | typeof ACTION_OUTCOME.SERVER_ERROR;

export type TSubmitContactResult = TActionResult<
  TContactRefusal,
  TContactField,
  TFieldErrorReason
>;

const BLOCKED = toOutcome(ACTION_OUTCOME.BLOCKED);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

const { isBotOrUnverified, isRateLimited } = createPublicWriteGuard({
  name: 'contact-form-submit',
  blockedEvent: CONTACT_FORM_LOG.SUBMIT_BLOCKED,
  windowMs: 10 * 60_000,
  maxRequests: 5,
});

// A server action's arguments arrive from the network, whatever their declared type.
const asText = (value: unknown): string => (isString(value) ? value : '');

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
): Promise<TMaybeUndefined<Pick<schema.TLead, 'id'>>> => {
  try {
    return await queries.leads.createLead(input);
  } catch (error) {
    logger.error(CONTACT_FORM_LOG.LEAD_STORE_FAILED, { error });
    return undefined;
  }
};

/** Only an inline Server Action may call this, so the browser never supplies `source`. */
export const submitContactMessage = async (
  input: TContactMessageInput,
  { sourceDocumentId, sourceLocale }: TContactMessageSource,
): Promise<TSubmitContactResult> => {
  if (await isBotOrUnverified()) return BLOCKED;

  if (asText(input.website)) {
    logger.warn(CONTACT_FORM_LOG.SUBMIT_BLOCKED, { reason: 'honeypot' });
    return BLOCKED;
  }

  const tenant = await resolveRequestTenant();
  if (!tenant) {
    logger.error(CONTACT_FORM_LOG.TENANT_UNRESOLVED);
    return SERVER_ERROR;
  }

  if (await isRateLimited(tenant.id)) return BLOCKED;

  if (!(await isContactFormOpen(tenant))) {
    logger.warn(CONTACT_FORM_LOG.SUBMIT_BLOCKED, { reason: 'unavailable' });
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
      fieldErrors: validation.error,
    };
  }

  const leadInput = {
    tenantId: tenant.id,
    ...validation.data,
    sourcePath: toSourcePath(asText(input.sourcePath)),
    sourceDocumentId,
    sourceLocale,
  };
  const lead = await storeLead(leadInput);
  if (!lead) return SERVER_ERROR;

  try {
    await sendContactNotification(leadInput);
  } catch (error) {
    logger.error(CONTACT_FORM_LOG.NOTIFICATION_SEND_FAILED, {
      leadId: lead.id,
      error,
    });
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
