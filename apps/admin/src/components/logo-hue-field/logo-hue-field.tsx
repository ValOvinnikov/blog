'use client';

import { HueSlider } from '@admin/components/hue-slider';
import {
  accentHueGradient,
  buildLogoPreviewTokens,
} from '@admin/utils/theme-preview-tokens/theme-preview-tokens';
import { Switch } from '@base-ui/react/switch';

import { logoHueFieldVariants } from './logo-hue-field-variants';

export type TLogoHueFieldProps = {
  accentHue: number;
  /** `undefined` means "follows the accent hue". */
  logoHue: number | undefined;
  onChange: (logoHue: number | undefined) => void;
  isDark: boolean;
};

/**
 * The logo hue's distinct "follows accent" state — a real slider pre-set to
 * the accent value would be indistinguishable from a tenant who deliberately
 * chose that same hue, so this toggles the field itself rather than a value.
 */
export function LogoHueField({
  accentHue,
  logoHue,
  onChange,
  isDark,
}: TLogoHueFieldProps) {
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
          aria-label="Follow accent hue"
          className={switchTrack()}
        >
          <Switch.Thumb className={switchThumb()} />
        </Switch.Root>
        <span>Follow accent hue</span>
      </div>

      <div className={hueField()}>
        <span className={tonesSlot()} aria-hidden="true">
          <span className={tone()} style={{ background: tones['--logo-1'] }} />
          <span className={tone()} style={{ background: tones['--logo-2'] }} />
          <span className={tone()} style={{ background: tones['--logo-3'] }} />
        </span>
        <HueSlider
          ariaLabel="Logo hue"
          value={resolvedHue}
          onChange={onChange}
          disabled={follows}
          trackStyle={{ background: accentHueGradient() }}
        />
        <span className={hueValue()}>
          {follows ? 'follows accent' : `hue ${resolvedHue}°`}
        </span>
      </div>
    </div>
  );
}
