import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { LookSubsection } from '@platform/components/features/look/look-form/components/look-subsection';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SampleSpinner } from '@platform/components/features/site-preview/sample-spinner';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { OptionSelect } from '@platform/components/shared/option-select';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import {
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  ICONS,
  SPINNER_STYLE,
} from '@shinefold/config';
import { toOptions } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { ButtonColorFields } from './components/button-color-fields/button-color-fields';

export type TButtonsCardProps = {
  summary: string;
};

export const ButtonsCard = ({ summary }: TButtonsCardProps) => {
  const {
    values: { busyButtonStyle, spinnerStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const spinnerLock = useLookFieldLock('spinnerStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.BUTTONS],
  );

  const shapeOptions = toLookGlyphOptions(
    'buttonShape',
    BUTTON_SHAPE,
    (shape) => t(`buttonShapeOptionLabel.${shape}`),
  );

  const busyOptions = toLookGlyphOptions(
    'busyButtonStyle',
    BUSY_BUTTON_STYLE,
    (style) => t(`busyButtonStyleOptionLabel.${style}`),
  );

  const spinnerOptions = toOptions(SPINNER_STYLE, (style) =>
    t(`spinnerStyleOptionLabel.${style}`),
  ).map((option) => ({
    ...option,
    glyph: <SampleSpinner variant={option.value} />,
    triggerGlyph: <SampleSpinner variant={option.value} isStill={true} />,
  }));

  const spinnerStyleLabel = t('spinnerStyleLabel');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.BUTTONS}
      description={t('buttonsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookPresetChoiceField
        field="buttonShape"
        label={t('buttonShapeLabel')}
        hint={t('buttonShapeDescription')}
        options={shapeOptions}
        layout={SEGMENTED_LAYOUT.SINGLE_ROW}
      />
      <ButtonColorFields />

      <LookSubsection heading={t('buttonsWhileWorkingHeading')}>
        <LookChoiceField
          field="busyButtonStyle"
          label={t('busyButtonStyleLabel')}
          hint={t('busyButtonStyleDescription')}
          options={busyOptions}
        />
        <LookField
          field="spinnerStyle"
          label={spinnerStyleLabel}
          hint={t('spinnerStyleDescription')}
          lock={spinnerLock}
        >
          <OptionSelect
            appearance={SELECT_APPEARANCE.COMPACT}
            aria={spinnerLock.aria}
            options={spinnerOptions}
            value={spinnerStyle}
            onChange={(style) => updateField('spinnerStyle', style)}
            lock={spinnerLock}
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
