'use client';

import { LookFollowSwitch } from '@platform/components/features/look/look-follow-switch';
import { accentSwatchVariants } from '@platform/components/shared/accent-swatch/accent-swatch-variants';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { buildLogoPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { logoHueFieldVariants } from './logo-hue-field-variants';

export type TLogoHueFieldProps = {
  accentHue: number;
  logoHue: TMaybeUndefined<number>;
  onChange: (logoHue: TMaybeUndefined<number>) => void;
  isLocked?: boolean;
  growthBadgeId?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const LogoHueField = ({
  accentHue,
  logoHue,
  onChange,
  isLocked = false,
  growthBadgeId,
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
  } = logoHueFieldVariants();

  return (
    <div className={root()}>
      <LookFollowSwitch
        label={t('followAccentHue')}
        isFollowing={follows}
        onFollowChange={(checked) => onChange(checked ? undefined : accentHue)}
        lock={{
          isLocked,
          growthBadgeId,
          describedBy: ariaDescribedBy,
        }}
        lockedReadout={t('followsAccent')}
      />

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
            isLocked={isLocked}
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
