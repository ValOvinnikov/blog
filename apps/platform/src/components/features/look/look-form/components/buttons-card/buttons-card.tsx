import {
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  ICONS,
  SPINNER_STYLE,
  type TBusyButtonStyle,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookSubsection } from '@platform/components/features/look/look-form/components/look-subsection';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

export type TButtonsCardProps = {
  summary: string;
};

export const ButtonsCard = ({ summary }: TButtonsCardProps) => {
  const {
    values: { busyButtonStyle, spinnerStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const busyLock = useLookFieldLock('busyButtonStyle');
  const spinnerLock = useLookFieldLock('spinnerStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.BUTTONS],
  );

  const shapeOptions = Object.values(BUTTON_SHAPE).map((shape) => ({
    value: shape,
    label: t(`buttonShapeOptionLabel.${shape}`),
    glyph: <LookOptionGlyph field="buttonShape" value={shape} />,
  }));

  const busyOptions = toOptions(BUSY_BUTTON_STYLE, (style) =>
    t(`busyButtonStyleOptionLabel.${style}`),
  );

  const spinnerOptions = toOptions(SPINNER_STYLE, (style) =>
    t(`spinnerStyleOptionLabel.${style}`),
  );

  const spinnerStyleLabel = t('spinnerStyleLabel');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.BUTTONS}
      description={t('buttonsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookChoiceField
        field="buttonShape"
        label={t('buttonShapeLabel')}
        hint={t('buttonShapeDescription')}
        options={shapeOptions}
        layout={SEGMENTED_LAYOUT.SINGLE_ROW}
      />

      <LookSubsection heading={t('buttonsWhileWorkingHeading')}>
        <LookField
          field="busyButtonStyle"
          label={t('busyButtonStyleLabel')}
          hint={t('busyButtonStyleDescription')}
          isGroup={true}
          labelId={busyLock.labelId}
          growthBadgeId={busyLock.growthBadgeId}
        >
          <SegmentedControl<TBusyButtonStyle>
            aria={busyLock.aria}
            options={busyOptions}
            value={busyButtonStyle}
            onChange={(style) => updateField('busyButtonStyle', style)}
            lock={busyLock}
          />
        </LookField>
        <LookField
          field="spinnerStyle"
          label={spinnerStyleLabel}
          hint={t('spinnerStyleDescription')}
          labelId={spinnerLock.labelId}
          growthBadgeId={spinnerLock.growthBadgeId}
        >
          <OptionSelect
            appearance={SELECT_APPEARANCE.COMPACT}
            aria={spinnerLock.aria}
            options={spinnerOptions}
            value={spinnerStyle}
            onChange={(style) => updateField('spinnerStyle', style)}
            isDisabled={spinnerLock.isDisabled}
            isLocked={spinnerLock.isLocked}
          />
          {busyButtonStyle === BUSY_BUTTON_STYLE.EDGE && (
            <LockedReason icon={ICONS.INFO}>
              {t('spinnerEdgeNote')}
            </LockedReason>
          )}
          <PresetValueButton
            field="spinnerStyle"
            fieldLabel={spinnerStyleLabel}
          />
        </LookField>
      </LookSubsection>
    </LookCard>
  );
};
