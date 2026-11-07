import type { TLookFormContext } from '@platform/components/features/look/look-form-provider';
import type { TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useTranslations } from 'next-intl';

import { LOOK_ROW_TITLE_KEY } from './look-row-title-key';

export const useLookUnsavedCards = (
  { hasCardChanges }: Pick<TLookFormContext, 'hasCardChanges'>,
  revealCard: (card: TLookCard) => void,
) => {
  const t = useTranslations('lookForm');

  return Object.values(LOOK_ROW)
    .filter(hasCardChanges)
    .map((row) => ({
      name: t(LOOK_ROW_TITLE_KEY[row]),
      onSelect: () => revealCard(row),
    }));
};
