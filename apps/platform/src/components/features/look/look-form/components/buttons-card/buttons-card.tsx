import {
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  ICONS,
  SPINNER_STYLE,
  type TBusyButtonStyle,
  type TButtonShape,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookSubheading } from '@platform/components/features/look/look-form/components/look-subheading';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

export type TButtonsCardProps = {
  summary: string;
};

export const ButtonsCard = ({ summary }: TButtonsCardProps) => {
  const {
    values: { buttonShape, busyButtonStyle, spinnerStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const shapeLock = useLookFieldLock('buttonShape');
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

  const shapeLabel = t('buttonShapeLabel');
  const spinnerStyleLabel = t('spinnerStyleLabel');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.BUTTONS}
      description={t('buttonsDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="buttonShape"
        label={shapeLabel}
        hint={t('buttonShapeDescription')}
        isGroup={true}
        labelId={shapeLock.labelId}
        growthBadgeId={shapeLock.growthBadgeId}
      >
        <SegmentedControl<TButtonShape>
          aria={shapeLock.aria}
          options={shapeOptions}
          value={buttonShape}
          onChange={(shape) => updateField('buttonShape', shape)}
          isDisabled={shapeLock.isDisabled}
          isLocked={shapeLock.isLocked}
          isSingleRow={true}
        />
        <PresetValueButton field="buttonShape" fieldLabel={shapeLabel} />
      </LookField>

      <LookSubheading>{t('buttonsWhileWorkingHeading')}</LookSubheading>

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
          isDisabled={busyLock.isDisabled}
          isLocked={busyLock.isLocked}
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
          <LockedReason icon={ICONS.INFO}>{t('spinnerEdgeNote')}</LockedReason>
        )}
        <PresetValueButton
          field="spinnerStyle"
          fieldLabel={spinnerStyleLabel}
        />
      </LookField>
    </LookCard>
  );
};
