'use client';

import type { TMaybeUndefined } from '@blog/config';
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
  'aria-describedby': ariaDescribedBy,
}: TLogoHueFieldProps) => {
  const t = useTranslations('logoHueField');
  const follows = logoHue === undefined;
  const resolvedHue = logoHue ?? accentHue;
  const tones = buildLogoPreviewTokens(resolvedHue, false);

  const {
    root,
    hueField,
    tones: tonesSlot,
    tone,
    hueValue,
  } = logoHueFieldVariants({ follows });

  return (
    <div className={root()}>
      <Switch
        aria={{ label: t('followAccentHue'), describedBy: ariaDescribedBy }}
        isChecked={follows}
        onCheckedChange={(checked) => onChange(checked ? undefined : accentHue)}
        labels={{ caption: t('followAccentHue') }}
        isDisabled={isDisabled}
      />

      <div className={hueField()}>
        <span className={tonesSlot()} aria-hidden="true">
          <span className={tone()} style={{ background: tones['--logo-1'] }} />
          <span className={tone()} style={{ background: tones['--logo-2'] }} />
          <span className={tone()} style={{ background: tones['--logo-3'] }} />
        </span>
        <HueSlider
          ariaLabel={t('logoHueAriaLabel')}
          value={resolvedHue}
          onChange={onChange}
          isDisabled={follows || isDisabled}
          aria-describedby={ariaDescribedBy}
        />
        <span className={hueValue()}>
          {follows ? t('followsAccent') : t('hueValue', { hue: resolvedHue })}
        </span>
      </div>
    </div>
  );
};
