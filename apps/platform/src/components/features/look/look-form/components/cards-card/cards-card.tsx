import { CARD_STYLE } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

export type TCardsCardProps = {
  summary: string;
};

export const CardsCard = ({ summary }: TCardsCardProps) => {
  const t = useTranslations('lookForm');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.CARDS],
  );

  const options = Object.values(CARD_STYLE).map((style) => ({
    value: style,
    label: t(`cardStyleOptionLabel.${style}`),
    description: t(`cardStyleOptionDescription.${style}`),
  }));

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.CARDS}
      description={t('cardsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookPresetChoiceField
        field="cardStyle"
        label={t('cardStyleLabel')}
        hint={t('cardStyleDescription')}
        options={options}
      />
    </LookCard>
  );
};
