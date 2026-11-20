import type { ACTIVITY_DETAIL } from '@platform/constants/activity';
import type { TTenantDetailsField } from '@platform/constants/tenant';
import type { TGrantItem } from '@platform/utils/grant-item-label/grant-item-label';
import type { TLocaleIsoCode } from '@shinefold/config';
import type { TOAuthProvider, TTenantPlan } from '@shinefold/config/constants';
import type { TSuspensionCategory } from '@shinefold/db/constants';

export type TActivityDetail =
  | {
      kind: typeof ACTIVITY_DETAIL.CHANGED_FIELDS;
      fields: readonly TTenantDetailsField[];
    }
  | {
      kind:
        | typeof ACTIVITY_DETAIL.STUDIO_INVITE_SENT
        | typeof ACTIVITY_DETAIL.STUDIO_INVITE_UNSENT
        | typeof ACTIVITY_DETAIL.CLIENT_SECRET_REPLACED
        | typeof ACTIVITY_DETAIL.GRANT_UNTIL_REVOKED;
    }
  | {
      kind: typeof ACTIVITY_DETAIL.MAIN_ADDRESS_CHANGED;
      from: string;
      to: string;
    }
  | {
      kind:
        | typeof ACTIVITY_DETAIL.CUSTOM_DOMAIN_REQUESTED
        | typeof ACTIVITY_DETAIL.CUSTOM_DOMAIN_REMOVED;
      domain: string;
    }
  | {
      kind: typeof ACTIVITY_DETAIL.ADDITIONAL_LANGUAGES;
      locales: TLocaleIsoCode[];
    }
  | {
      kind: typeof ACTIVITY_DETAIL.SUSPENSION_REASON;
      category: TSuspensionCategory;
    }
  | { kind: typeof ACTIVITY_DETAIL.SUSPENSION_REFERENCE; reference: string }
  | { kind: typeof ACTIVITY_DETAIL.PLAN; plan: TTenantPlan }
  | {
      kind: typeof ACTIVITY_DETAIL.PLAN_CHANGED;
      from: TTenantPlan;
      to: TTenantPlan;
    }
  | { kind: typeof ACTIVITY_DETAIL.SIGN_IN_PROVIDER; provider: TOAuthProvider }
  | { kind: typeof ACTIVITY_DETAIL.GRANT_ITEM; item: TGrantItem }
  | { kind: typeof ACTIVITY_DETAIL.GRANT_EXPIRY; expiresAt: Date }
  | { kind: typeof ACTIVITY_DETAIL.GRANT_NOTE; note: string };
