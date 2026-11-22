'use client';

import { GrantChoiceField } from '@platform/components/features/entitlement-grants/grant-choice-field';
import { GrantEntitlementDialog } from '@platform/components/features/entitlement-grants/grant-entitlement-dialog';
import { GRANTS_CARD_HEADING_ID } from '@platform/constants/entitlement-grant';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import type { TMaybeNull } from '@shinefold/config';
import { MODULE_PACK, type TModulePack } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const PACKS = Object.values(MODULE_PACK);

export type TGrantModulePackControlProps = {
  target: TGrantTarget;
  grantedPacks: readonly string[];
};

export const GrantModulePackControl = ({
  target,
  grantedPacks,
}: TGrantModulePackControlProps) => {
  const t = useTranslations('grantModulePack');
  const tGrant = useTranslations('grantEntitlement');
  const tNames = useTranslations('grantItemNames');
  const tPlan = useTranslations('planNames');
  const [pack, setPack] = useState<TMaybeNull<TModulePack>>(null);
  const { tenantId, tenantName, plan } = target;
  const { modulePacks: includedPacks } = PLAN_ENTITLEMENTS[plan];
  const itemLabel = pack ? tNames(`modulePack.${pack}`) : t('packLabel');

  return (
    <GrantEntitlementDialog
      tenantId={tenantId}
      item={
        pack ? { kind: ENTITLEMENT_KIND.MODULE_PACK, key: pack } : undefined
      }
      returnFocusId={GRANTS_CARD_HEADING_ID}
      onClose={() => setPack(null)}
      labels={{
        trigger: t('trigger'),
        title: t('title', { tenant: tenantName }),
        description: t('description', { plan: tPlan(plan) }),
        granted: tGrant('granted', { item: itemLabel }),
        failed: tGrant('failed', { item: itemLabel }),
      }}
    >
      <GrantChoiceField
        label={t('packLabel')}
        placeholder={t('packPlaceholder')}
        options={PACKS.map((value) => {
          const isIncluded = includedPacks.includes(value);
          const isGranted = grantedPacks.includes(value);
          const name = tNames(`modulePack.${value}`);

          return {
            value,
            label: isIncluded
              ? t('packIncluded', { pack: name })
              : isGranted
                ? t('packGranted', { pack: name })
                : name,
            isDisabled: isIncluded || isGranted,
          };
        })}
        value={pack}
        onChange={setPack}
      />
    </GrantEntitlementDialog>
  );
};
