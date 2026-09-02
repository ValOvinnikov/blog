'use client';

import { Switch } from '@base-ui/react/switch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import {
  accentHueGradient,
  buildLogoPreviewTokens,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { logoHueFieldVariants } from './logo-hue-field-variants';

export type TLogoHueFieldProps = {
  accentHue: number;
  /** `undefined` means "follows the accent hue". */
  logoHue: number | undefined;
  onChange: (logoHue: number | undefined) => void;
  isDark: boolean;
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
  isDark,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TLogoHueFieldProps) => {
  const t = useTranslations('logoHueField');
  const follows = logoHue === undefined;
  const resolvedHue = logoHue ?? accentHue;
  const tones = buildLogoPreviewTokens(resolvedHue, isDark);

  const {
    root,
    switchRow,
    switchTrack,
    switchThumb,
    hueField,
    tones: tonesSlot,
    tone,
    hueValue,
  } = logoHueFieldVariants({ follows });

  return (
    <div className={root()}>
      <div className={switchRow()}>
        <Switch.Root
          checked={follows}
          onCheckedChange={(checked) =>
            onChange(checked ? undefined : accentHue)
          }
          disabled={isDisabled}
          aria-label={t('followAccentHue')}
          aria-describedby={ariaDescribedBy}
          className={switchTrack()}
        >
          <Switch.Thumb className={switchThumb()} />
        </Switch.Root>
        <span>{t('followAccentHue')}</span>
      </div>

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
          trackStyle={{ background: accentHueGradient() }}
        />
        <span className={hueValue()}>
          {follows ? t('followsAccent') : t('hueValue', { hue: resolvedHue })}
        </span>
      </div>
    </div>
  );
};
