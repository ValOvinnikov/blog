'use client';

import {
  ENTITLEMENT_GRANT_REFUSAL,
  type TEntitlementGrantRefusal,
} from '@platform/constants/entitlement-grant';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TGrantEntitlementResult } from '@platform/server/entitlement-grants/grant-entitlement-action';
import type { TRevokeEntitlementGrantResult } from '@platform/server/entitlement-grants/revoke-entitlement-grant-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeRefused, isOutcomeSuccess } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type TGrantRefusalReason =
  | TEntitlementGrantRefusal
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED;

const REFUSAL_KEYS = {
  [TENANT_REFUSAL.NOT_FOUND]: 'notFound',
  [TENANT_REFUSAL.ARCHIVED]: 'archived',
  [ENTITLEMENT_GRANT_REFUSAL.COMING_SOON]: 'comingSoon',
  [ENTITLEMENT_GRANT_REFUSAL.ALREADY_GRANTED]: 'alreadyGranted',
  [ENTITLEMENT_GRANT_REFUSAL.INCLUDED_IN_PLAN]: 'includedInPlan',
  [ENTITLEMENT_GRANT_REFUSAL.GRANT_NOT_OPEN]: 'grantNotOpen',
} satisfies Record<TGrantRefusalReason, string>;

export const useGrantAction = (failedMessage: string) => {
  const t = useTranslations('entitlementGrantErrors');
  const router = useRouter();

  return async (
    request: Promise<TGrantEntitlementResult | TRevokeEntitlementGrantResult>,
  ) => {
    const result = await settleAction(request);
    if (isOutcomeSuccess(result)) return okResult();
    if (isOutcomeRefused(result)) {
      router.refresh();
      return errorResult(t(REFUSAL_KEYS[result.reason]));
    }

    return errorResult(failedMessage);
  };
};
