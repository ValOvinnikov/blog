import {
  AUDIT_ACTION,
  LOCALE_ISO_CODES,
  type TAuditAction,
  type TLocaleIsoCode,
  type TMaybeNull,
} from '@blog/config';
import {
  OAUTH_PROVIDER,
  type TOAuthProvider,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/config/constants';
import {
  SUSPENSION_CATEGORY,
  type TSuspensionCategory,
} from '@blog/db/constants';
import { hasArrayGotItems, hasLength } from '@blog/utils/primitives';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import {
  TENANT_DETAILS_FIELD,
  type TTenantDetailsField,
} from '@platform/constants/tenant';
import { z } from 'zod';

const D = ACTIVITY_DETAIL;

export type TActivityDetail =
  | { kind: typeof D.CHANGED_FIELDS; fields: readonly TTenantDetailsField[] }
  | {
      kind:
        | typeof D.STUDIO_INVITE_SENT
        | typeof D.STUDIO_INVITE_UNSENT
        | typeof D.CLIENT_SECRET_REPLACED;
    }
  | { kind: typeof D.MAIN_ADDRESS_CHANGED; from: string; to: string }
  | {
      kind: typeof D.CUSTOM_DOMAIN_REQUESTED | typeof D.CUSTOM_DOMAIN_REMOVED;
      domain: string;
    }
  | { kind: typeof D.ADDITIONAL_LANGUAGES; locales: TLocaleIsoCode[] }
  | { kind: typeof D.SUSPENSION_REASON; category: TSuspensionCategory }
  | { kind: typeof D.SUSPENSION_REFERENCE; reference: string }
  | { kind: typeof D.PLAN; plan: TTenantPlan }
  | { kind: typeof D.SIGN_IN_PROVIDER; provider: TOAuthProvider };

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
  provider: optional(z.enum(OAUTH_PROVIDER)),
  isSecretReplaced: optional(z.boolean()),
});

export const toActivityDetails = (
  action: TAuditAction,
  details: TMaybeNull<Record<string, unknown>>,
): TActivityDetail[] => {
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
    provider,
    isSecretReplaced,
  } = activityDetailsSchema.parse(details ?? {});
  const candidates: Array<TActivityDetail | false | undefined> = [
    hasArrayGotItems(changedFields) && {
      kind: D.CHANGED_FIELDS,
      fields: changedFields,
    },
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
