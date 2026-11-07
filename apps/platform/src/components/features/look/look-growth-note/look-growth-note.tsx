import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { GrowthNote } from '@platform/components/shared/growth-note';
import type { TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  scrollToLookAnchor,
  toLookAnchorId,
} from '@platform/utils/look-anchor/look-anchor';
import { useTranslations } from 'next-intl';

export type TLookGrowthNoteProps = {
  onSelectCard: (card: TLookCard) => void;
};

const GROWTH_ROWS = [
  { row: LOOK_ROW.COLOUR, descriptionKey: 'growthAddsColour' },
  { row: LOOK_ROW.TYPE, descriptionKey: 'growthAddsType' },
  { row: LOOK_ROW.SHAPE, descriptionKey: 'growthAddsShape' },
  { row: LOOK_ROW.BUTTONS, descriptionKey: 'growthAddsButtons' },
  { row: LOOK_ROW.HEADER, descriptionKey: 'growthAddsHeader' },
  { row: LOOK_ROW.FOOTER, descriptionKey: 'growthAddsFooter' },
] as const;

export const LookGrowthNote = ({ onSelectCard }: TLookGrowthNoteProps) => {
  const t = useTranslations('lookForm');

  return (
    <GrowthNote
      items={GROWTH_ROWS.map(({ row, descriptionKey }) => ({
        id: row,
        label: t(LOOK_ROW_TITLE_KEY[row]),
        description: t(descriptionKey),
        link: {
          href: `#${toLookAnchorId(row)}`,
          onSelect: () => {
            onSelectCard(row);
            scrollToLookAnchor(row);
          },
        },
      }))}
      closingLine={t('growthAddsClosing')}
    />
  );
};
