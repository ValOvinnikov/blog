'use client';

import { GrantChoiceField } from '@platform/components/features/entitlement-grants/grant-choice-field';
import { GrantEntitlementDialog } from '@platform/components/features/entitlement-grants/grant-entitlement-dialog';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import { LOCALE_ISO_CODES } from '@shinefold/config';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ADDITIONAL_LANGUAGE_COUNTS = Array.from(
  { length: Object.values(LOCALE_ISO_CODES).length - 1 },
  (_, index) => String(index + 1),
);
const [FEWEST_ADDITIONAL_LANGUAGES = ''] = ADDITIONAL_LANGUAGE_COUNTS;

export type TGrantLanguagesControlProps = {
  target: TGrantTarget;
};

export const GrantLanguagesControl = ({
  target,
}: TGrantLanguagesControlProps) => {
  const t = useTranslations('grantLanguages');
  const tGrant = useTranslations('grantEntitlement');
  const tNames = useTranslations('grantItemNames');
  const tPlan = useTranslations('planNames');
  const [count, setCount] = useState(FEWEST_ADDITIONAL_LANGUAGES);
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
      onClose={() => setCount(FEWEST_ADDITIONAL_LANGUAGES)}
      labels={{
        trigger: t('trigger'),
        title: t('title', { tenant: tenantName }),
        description: t('description', {
          plan: tPlan(plan),
          tenant: tenantName,
        }),
        granted: tGrant('granted', { item: countLabel(count) }),
        failed: tGrant('failed', { item: countLabel(count) }),
      }}
    >
      <GrantChoiceField
        label={t('countLabel')}
        hint={t('countHint')}
        options={ADDITIONAL_LANGUAGE_COUNTS.map((value) => ({
          value,
          label: countLabel(value),
        }))}
        value={count}
        onChange={setCount}
      />
    </GrantEntitlementDialog>
  );
};
