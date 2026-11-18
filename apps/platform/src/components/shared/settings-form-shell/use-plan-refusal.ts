'use client';

import {
  isNotInPlanRefusal,
  type TNotInPlanRefusal,
} from '@platform/utils/plan-refusal/plan-refusal';
import { restoreRefusedItems } from '@platform/utils/restore-refused-items/restore-refused-items';
import type { TSettingsDraftField } from '@platform/utils/settings-draft-offer/settings-draft-offer';
import type {
  TActionOutcome,
  TMaybeUndefined,
  TOutcome,
} from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type Dispatch, type SetStateAction } from 'react';

export const usePlanRefusal = <TValues>(
  fields: TSettingsDraftField<TValues>[],
) => {
  const t = useTranslations('saveBar');
  const format = useFormatter();
  const router = useRouter();
  const [refusal, setRefusal] = useState<TMaybeUndefined<TNotInPlanRefusal>>();

  const submit = async <TResult extends TOutcome<TActionOutcome>>(
    run: () => Promise<TResult>,
    setValues: Dispatch<SetStateAction<TValues>>,
    savedValues: TValues,
  ) => {
    setRefusal(undefined);
    const result = await run();
    if (isNotInPlanRefusal(result)) {
      setValues((current) =>
        restoreRefusedItems(current, savedValues, result.items),
      );
      setRefusal(result);
      router.refresh();
    }
    return result;
  };

  const labelOf = (item: string) =>
    fields.find(({ id }) => id === item)?.label ?? item;

  const message =
    refusal &&
    t('notInPlan', {
      plan: refusal.values.plan,
      items: format.list(refusal.items.map(labelOf)),
    });

  return { submit, clear: () => setRefusal(undefined), message };
};
