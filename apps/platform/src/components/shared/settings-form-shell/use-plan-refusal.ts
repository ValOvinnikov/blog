'use client';

import type { TMaybeUndefined } from '@blog/config';
import { useTenantPlan } from '@platform/context/tenant-plan-provider';
import type { TNotInPlanRefusal } from '@platform/utils/plan-refusal/plan-refusal';
import type { TSettingsDraftField } from '@platform/utils/settings-draft-offer/settings-draft-offer';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

export const usePlanRefusal = <TValues>(
  fields: TSettingsDraftField<TValues>[],
) => {
  const t = useTranslations('saveBar');
  const format = useFormatter();
  const router = useRouter();
  const renderedPlan = useTenantPlan();
  const [refusal, setRefusal] = useState<TMaybeUndefined<TNotInPlanRefusal>>();

  const refuse = (next: TNotInPlanRefusal) => {
    setRefusal(next);
    if (next.values.plan !== renderedPlan) router.refresh();
  };

  const labelOf = (item: string) =>
    fields.find(({ id }) => id === item)?.label ?? item;

  const message =
    refusal &&
    t('notInPlan', {
      plan: refusal.values.plan,
      items: format.list(refusal.items.map(labelOf)),
    });

  return { refuse, clear: () => setRefusal(undefined), message };
};
