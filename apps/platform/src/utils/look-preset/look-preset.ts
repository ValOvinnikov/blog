import { PRESET_REGISTRY, type TPresetId } from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TPresetSeededField =
  | 'accentHue'
  | 'headingFont'
  | 'bodyFont'
  | 'radiusScale'
  | 'density'
  | 'cardStyle'
  | 'headerControlStyle'
  | 'spinnerStyle'
  | 'buttonShape';

type TPresetSeededValues = Pick<TLookFormValues, TPresetSeededField>;

const presetSeededValues = (preset: TPresetId): TPresetSeededValues => {
  const {
    themeTokens: { accentHue, headingFont, bodyFont, radiusScale, density },
    cardStyle,
    headerControlStyle,
    spinnerStyle,
    buttonShape,
  } = PRESET_REGISTRY[preset];

  return {
    accentHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    cardStyle,
    headerControlStyle,
    spinnerStyle,
    buttonShape,
  };
};

export const isPresetValue = (
  field: TPresetSeededField,
  values: TLookFormValues,
): boolean => values[field] === presetSeededValues(values.preset)[field];

export const applyPresetDefaults = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => ({
  ...current,
  ...presetSeededValues(preset),
  preset,
  logoHue: undefined,
});

/** A seeded option still at the old preset's value takes the new preset's; one the owner changed is kept. */
export const switchPreset = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => {
  const previous = presetSeededValues(current.preset);
  const next = presetSeededValues(preset);
  const keepCustomised = <K extends TPresetSeededField>(
    field: K,
  ): TPresetSeededValues[K] =>
    current[field] === previous[field] ? next[field] : current[field];

  return {
    ...current,
    preset,
    accentHue: keepCustomised('accentHue'),
    headingFont: keepCustomised('headingFont'),
    bodyFont: keepCustomised('bodyFont'),
    radiusScale: keepCustomised('radiusScale'),
    density: keepCustomised('density'),
    cardStyle: keepCustomised('cardStyle'),
    headerControlStyle: keepCustomised('headerControlStyle'),
    spinnerStyle: keepCustomised('spinnerStyle'),
    buttonShape: keepCustomised('buttonShape'),
  };
};

export const withPresetValue = (
  field: TPresetSeededField,
  current: TLookFormValues,
): TLookFormValues => ({
  ...current,
  [field]: presetSeededValues(current.preset)[field],
});
