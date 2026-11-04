import type { TMaybeUndefined } from '@blog/config';
import type { TLookField } from '@blog/db/constants';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export type TLookFieldLock = {
  id: string;
  reason: string;
};

export const useLookFieldLock = (field: TLookField) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { isLocked } = useLookForm();
  const t = useTranslations('featuresSettings');
  const lockId = useId();
  const isFieldLocked = isLocked(field);

  const lock: TMaybeUndefined<TLookFieldLock> = isFieldLocked
    ? { id: lockId, reason: t('planLockedBadge') }
    : undefined;
  const describedBy = joinIds(archivedDescribedBy, lock?.id);

  return { isDisabled: isArchived || isFieldLocked, describedBy, lock };
};
