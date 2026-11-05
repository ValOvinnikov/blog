import type { TControlAria, TMaybeUndefined } from '@blog/config';
import type { TLookField } from '@blog/db/constants';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { useId } from 'react';

export const useLookFieldLock = (field: TLookField) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { isLocked } = useLookForm();
  const labelId = useId();
  const badgeId = useId();
  const isFieldLocked = !isArchived && isLocked(field);
  const growthBadgeId: TMaybeUndefined<string> = isFieldLocked
    ? badgeId
    : undefined;
  const aria: TControlAria = {
    labelledBy: isFieldLocked ? joinIds(labelId, badgeId) : undefined,
    describedBy: joinIds(archivedDescribedBy, growthBadgeId),
  };

  return {
    isDisabled: isArchived,
    isLocked: isFieldLocked,
    aria,
    labelId,
    growthBadgeId,
  };
};
