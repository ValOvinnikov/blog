'use client';

import { GrantEntitlementDialog } from '@platform/components/features/entitlement-grants/grant-entitlement-dialog';
import type { TEntitlementGrantInput } from '@platform/server/entitlement-grants/entitlement-grant-input-schema';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

type TGrantedFeatureItem = Extract<
  TEntitlementGrantInput['item'],
  {
    kind:
      | typeof ENTITLEMENT_KIND.CAPABILITY
      | typeof ENTITLEMENT_KIND.LOOK_FIELD
      | typeof ENTITLEMENT_KIND.PRESET;
  }
>;

export type TGrantEntitlementControlProps = {
  target: TGrantTarget;
  item: TGrantedFeatureItem;
  itemLabel: string;
  returnFocusId: string;
  triggerLabel?: string;
};

export const GrantEntitlementControl = ({
  target,
  item,
  itemLabel,
  returnFocusId,
  triggerLabel,
}: TGrantEntitlementControlProps) => {
  const t = useTranslations('grantEntitlement');
  const tPlan = useTranslations('planNames');
  const { tenantId, tenantName, plan } = target;

  return (
    <GrantEntitlementDialog
      tenantId={tenantId}
      item={item}
      returnFocusId={returnFocusId}
      labels={{
        trigger: triggerLabel ?? t('trigger'),
        triggerAriaLabel: triggerLabel
          ? undefined
          : t('triggerAriaLabel', { item: itemLabel }),
        title: t('title', { item: itemLabel, tenant: tenantName }),
        description: t('description', {
          item: itemLabel,
          tenant: tenantName,
          plan: tPlan(plan),
        }),
        granted: t('granted', { item: itemLabel }),
        failed: t('failed', { item: itemLabel }),
      }}
    />
  );
};
