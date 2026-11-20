import type { TActivityDetail } from '@platform/components/features/tenants/activity-list/activity-detail';
import { toGrantActivityDetails } from '@platform/components/features/tenants/activity-list/to-grant-activity-details';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import { TENANT_DETAILS_FIELD } from '@platform/constants/tenant';
import {
  AUDIT_ACTION,
  LOCALE_ISO_CODES,
  type TAuditAction,
  type TMaybeNull,
} from '@shinefold/config';
import { OAUTH_PROVIDER, TENANT_PLAN } from '@shinefold/config/constants';
import { SUSPENSION_CATEGORY } from '@shinefold/db/constants';
import {
  hasArrayGotItems,
  hasLength,
  isOneOf,
} from '@shinefold/utils/primitives';
import { z } from 'zod';

const D = ACTIVITY_DETAIL;
const GRANT_AUDIT_ACTIONS = [
  AUDIT_ACTION.ENTITLEMENT_GRANTED,
  AUDIT_ACTION.ENTITLEMENT_REVOKED,
];

const optional = <T extends z.ZodType>(schema: T) =>
  schema.optional().catch(undefined);

const activityDetailsSchema = z.object({
  changedFields: optional(z.array(z.enum(TENANT_DETAILS_FIELD))),
  studioReinviteRequested: optional(z.boolean()),
  studioReinviteUnsent: optional(z.boolean()),
  mainAddressChanged: optional(z.object({ from: z.string(), to: z.string() })),
  customDomainConnectRequested: optional(z.string()),
  customDomainRemoved: optional(z.string()),
  additionalLocales: optional(z.array(z.enum(LOCALE_ISO_CODES))),
  category: optional(z.enum(SUSPENSION_CATEGORY)),
  reference: optional(z.string()),
  plan: optional(z.enum(TENANT_PLAN)),
  planChanged: optional(
    z.object({ from: z.enum(TENANT_PLAN), to: z.enum(TENANT_PLAN) }),
  ),
  provider: optional(z.enum(OAUTH_PROVIDER)),
  isSecretReplaced: optional(z.boolean()),
});

export const toActivityDetails = (
  action: TAuditAction,
  details: TMaybeNull<Record<string, unknown>>,
): TActivityDetail[] => {
  if (isOneOf(GRANT_AUDIT_ACTIONS, action)) {
    return toGrantActivityDetails(details);
  }

  const {
    changedFields,
    studioReinviteRequested,
    studioReinviteUnsent,
    mainAddressChanged,
    customDomainConnectRequested,
    customDomainRemoved,
    additionalLocales,
    category,
    reference,
    plan,
    planChanged,
    provider,
    isSecretReplaced,
  } = activityDetailsSchema.parse(details ?? {});
  const otherChangedFields = planChanged
    ? changedFields?.filter((field) => field !== TENANT_DETAILS_FIELD.PLAN)
    : changedFields;
  const candidates: Array<TActivityDetail | false | undefined> = [
    hasArrayGotItems(otherChangedFields) && {
      kind: D.CHANGED_FIELDS,
      fields: otherChangedFields,
    },
    planChanged && { kind: D.PLAN_CHANGED, ...planChanged },
    studioReinviteRequested === true && { kind: D.STUDIO_INVITE_SENT },
    studioReinviteUnsent === true && { kind: D.STUDIO_INVITE_UNSENT },
    mainAddressChanged && {
      kind: D.MAIN_ADDRESS_CHANGED,
      ...mainAddressChanged,
    },
    hasLength(customDomainConnectRequested) && {
      kind: D.CUSTOM_DOMAIN_REQUESTED,
      domain: customDomainConnectRequested,
    },
    hasLength(customDomainRemoved) && {
      kind: D.CUSTOM_DOMAIN_REMOVED,
      domain: customDomainRemoved,
    },
    additionalLocales && {
      kind: D.ADDITIONAL_LANGUAGES,
      locales: additionalLocales,
    },
    category && { kind: D.SUSPENSION_REASON, category },
    hasLength(reference) && { kind: D.SUSPENSION_REFERENCE, reference },
    action === AUDIT_ACTION.CREATED && plan && { kind: D.PLAN, plan },
    provider && { kind: D.SIGN_IN_PROVIDER, provider },
    isSecretReplaced === true && { kind: D.CLIENT_SECRET_REPLACED },
  ];

  return candidates.filter((detail): detail is TActivityDetail =>
    Boolean(detail),
  );
};
