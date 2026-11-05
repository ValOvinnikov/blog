import type { TMaybeUndefined } from '@blog/config';
import type { TLookField } from '@blog/db/constants';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

import { useLookPresetName } from './use-look-preset-name';

type TLookLockLineKey = 'lockLineGrowthFields' | 'lockLineTypeFonts';

export const useLookRowLock = (
  fields: readonly TLookField[],
  lineKey: TLookLockLineKey = 'lockLineGrowthFields',
) => {
  const { isArchived } = useSettingsFormState();
  const { isLocked } = useLookForm();
  const presetName = useLookPresetName();
  const t = useTranslations('lookForm');
  const lockedCount = isArchived ? 0 : fields.filter(isLocked).length;
  const lockLine: TMaybeUndefined<string> =
    lockedCount > 0 ? t(lineKey, { preset: presetName }) : undefined;

  return {
    lockLine,
    hasGrowthBadge: lockedCount > 0 && lockedCount === fields.length,
  };
};
