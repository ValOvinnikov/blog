import { CARD_STYLE, ICONS, type TCardStyle } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { CardStyleGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { SegmentedRadioGroup } from '@platform/components/shared/segmented-control';
import { ICON_SIZE } from '@platform/constants/icon';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SEGMENTED_RADIO_LAYOUT } from '@platform/constants/segmented-control';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

import { cardsCardVariants } from './cards-card-variants';

export type TCardsCardProps = {
  summary: string;
};

export const CardsCard = ({ summary }: TCardsCardProps) => {
  const {
    values: { cardStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const lock = useLookFieldLock('cardStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.CARDS],
  );

  const options = Object.values(CARD_STYLE).map((style) => ({
    value: style,
    label: t(`cardStyleOptionLabel.${style}`),
    description: t(`cardStyleOptionDescription.${style}`),
    glyph: <CardStyleGlyph cardStyle={style} />,
  }));
  const label = t('cardStyleLabel');
  const { sectionNote } = cardsCardVariants();

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.CARDS}
      description={t('cardsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="cardStyle"
        label={label}
        hint={t('cardStyleDescription')}
        isGroup={true}
        labelId={lock.labelId}
        growthBadgeId={lock.growthBadgeId}
      >
        <SegmentedRadioGroup<TCardStyle>
          aria={{
            ...lock.aria,
            labelledBy: lock.aria.labelledBy ?? lock.labelId,
          }}
          layout={SEGMENTED_RADIO_LAYOUT.TILES}
          options={options}
          value={cardStyle}
          onChange={(style) => updateField('cardStyle', style)}
          lock={lock}
        />
        <PresetValueButton field="cardStyle" fieldLabel={label} />
        <LockedReason
          icon={ICONS.INFO}
          iconSize={ICON_SIZE.XS}
          isFieldDescription={false}
          className={sectionNote()}
        >
          {t('cardStyleSectionNote')}
        </LockedReason>
      </LookField>
    </LookCard>
  );
};
