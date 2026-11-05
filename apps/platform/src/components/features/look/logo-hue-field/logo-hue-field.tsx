'use client';

import { SIZE, type TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { accentSwatchVariants } from '@platform/components/shared/accent-swatch/accent-swatch-variants';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { Switch } from '@platform/components/shared/switch';
import { buildLogoPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { logoHueFieldVariants } from './logo-hue-field-variants';

export type TLogoHueFieldProps = {
  accentHue: number;
  logoHue: TMaybeUndefined<number>;
  onChange: (logoHue: TMaybeUndefined<number>) => void;
  isDisabled?: boolean;
  isLocked?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * The logo hue's distinct "follows accent" state — a real slider pre-set to
 * the accent value would be indistinguishable from a tenant who deliberately
 * chose that same hue, so this toggles the field itself rather than a value.
 */
export const LogoHueField = ({
  accentHue,
  logoHue,
  onChange,
  isDisabled = false,
  isLocked = false,
  'aria-describedby': ariaDescribedBy,
}: TLogoHueFieldProps) => {
  const t = useTranslations('logoHueField');
  const follows = isUndefined(logoHue);
  const resolvedHue = logoHue ?? accentHue;
  const tones = buildLogoPreviewTokens(resolvedHue, false);

  const {
    root,
    hueField,
    tones: tonesSlot,
    tone,
    hueValue,
    switchRow,
    readout,
  } = logoHueFieldVariants();

  return (
    <div className={root()}>
      <div className={switchRow()}>
        <Switch
          aria={{ label: t('followAccentHue'), describedBy: ariaDescribedBy }}
          isChecked={follows}
          onCheckedChange={(checked) =>
            onChange(checked ? undefined : accentHue)
          }
          labels={{ caption: t('followAccentHue') }}
          isDisabled={isDisabled}
          isLocked={isLocked}
        />
        {isLocked && follows && (
          <span className={readout()}>{t('followsAccent')}</span>
        )}
      </div>

      {!follows && (
        <div className={hueField()}>
          <span
            className={accentSwatchVariants({
              size: SIZE.LG,
              class: tonesSlot(),
            })}
            aria-hidden="true"
          >
            <span
              className={tone()}
              style={{ background: tones['--logo-1'] }}
            />
            <span
              className={tone()}
              style={{ background: tones['--logo-2'] }}
            />
            <span
              className={tone()}
              style={{ background: tones['--logo-3'] }}
            />
          </span>
          <HueSlider
            name={{ ariaLabel: t('logoHueAriaLabel') }}
            value={resolvedHue}
            onChange={onChange}
            isDisabled={isDisabled || isLocked}
            aria-describedby={ariaDescribedBy}
          />
          <span className={hueValue()}>
            {t('hueValue', { hue: resolvedHue })}
          </span>
        </div>
      )}
    </div>
  );
};
