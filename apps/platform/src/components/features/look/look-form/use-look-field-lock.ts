import type { TMaybeUndefined } from '@blog/config';
import type { TLookField } from '@blog/db/constants';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
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
  const describedBy =
    [archivedDescribedBy, lock?.id].filter(Boolean).join(' ') || undefined;

  return { isDisabled: isArchived || isFieldLocked, describedBy, lock };
};
