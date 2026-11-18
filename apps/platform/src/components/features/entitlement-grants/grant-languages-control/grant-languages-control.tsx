'use client';

import { GrantChoiceField } from '@platform/components/features/entitlement-grants/grant-choice-field';
import { GrantEntitlementDialog } from '@platform/components/features/entitlement-grants/grant-entitlement-dialog';
import { MOST_ADDITIONAL_LANGUAGES } from '@platform/constants/entitlement-grant';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const countsAbove = (allowed: number) =>
  Array.from({ length: MOST_ADDITIONAL_LANGUAGES - allowed }, (_, index) =>
    String(allowed + index + 1),
  );

export type TGrantLanguagesControlProps = {
  target: TGrantTarget;
  allowed: number;
};

export const GrantLanguagesControl = ({
  target,
  allowed,
}: TGrantLanguagesControlProps) => {
  const counts = countsAbove(allowed);
  const [fewest = ''] = counts;
  const t = useTranslations('grantLanguages');
  const tGrant = useTranslations('grantEntitlement');
  const tNames = useTranslations('grantItemNames');
  const tPlan = useTranslations('planNames');
  const [count, setCount] = useState(fewest);
  const { tenantId, tenantName, plan } = target;
  const countLabel = (value: string) =>
    tNames('languages', { count: Number(value) });

  return (
    <GrantEntitlementDialog
      tenantId={tenantId}
      item={{
        kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
        value: Number(count) + 1,
      }}
      onClose={() => setCount(fewest)}
      labels={{
        trigger: t('trigger'),
        title: t('title', { tenant: tenantName }),
        description:
          allowed === 0
            ? t('description', { plan: tPlan(plan), tenant: tenantName })
            : t('descriptionWithAllowance', {
                plan: tPlan(plan),
                n: allowed,
                tenant: tenantName,
              }),
        granted: tGrant('granted', { item: countLabel(count) }),
        failed: tGrant('failed', { item: countLabel(count) }),
      }}
    >
      <GrantChoiceField
        label={t('countLabel')}
        hint={t('countHint')}
        options={counts.map((value) => ({
          value,
          label: countLabel(value),
        }))}
        value={count}
        onChange={setCount}
      />
    </GrantEntitlementDialog>
  );
};
