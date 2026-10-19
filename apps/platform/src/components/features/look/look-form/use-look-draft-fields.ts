import { PRESET_ID, type TPresetId } from '@blog/config';
import { FONT_OPTIONS } from '@platform/config/fonts';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';

const PRESET_LABEL_KEY = {
  [PRESET_ID.CONSOLE]: 'console',
  [PRESET_ID.EDITORIAL]: 'editorial',
} as const satisfies Record<TPresetId, string>;

export const useLookDraftFields = () => {
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const tHue = useTranslations('logoHueField');
  const displayBrandImage = ({ file }: TStagedImage) =>
    file === undefined ? t('brandImageUnchanged') : t('brandImagePicked');

  return [
    {
      id: 'preset',
      label: t('presetLabel'),
      display: ({ preset }: TLookFormValues) =>
        tPreset(PRESET_LABEL_KEY[preset]),
    },
    {
      id: 'accentHue',
      label: t('accentHueLabel'),
      display: ({ accentHue }: TLookFormValues) =>
        tHue('hueValue', { hue: accentHue }),
    },
    {
      id: 'logoHue',
      label: t('logoHueLabel'),
      display: ({ logoHue }: TLookFormValues) =>
        logoHue === undefined
          ? tHue('followsAccent')
          : tHue('hueValue', { hue: logoHue }),
    },
    {
      id: 'headingFont',
      label: t('headingFontLabel'),
      display: ({ headingFont }: TLookFormValues) =>
        FONT_OPTIONS[headingFont].label,
    },
    {
      id: 'bodyFont',
      label: t('bodyFontLabel'),
      display: ({ bodyFont }: TLookFormValues) => FONT_OPTIONS[bodyFont].label,
    },
    {
      id: 'radiusScale',
      label: t('radiusScaleLabel'),
      display: ({ radiusScale }: TLookFormValues) =>
        t(`radiusScaleOptionLabel.${radiusScale}`),
    },
    {
      id: 'density',
      label: t('densityLabel'),
      display: ({ density }: TLookFormValues) =>
        t(`densityOptionLabel.${density}`),
    },
    {
      id: 'cardStyle',
      label: t('cardStyleLabel'),
      display: ({ cardStyle }: TLookFormValues) =>
        t(`cardStyleOptionLabel.${cardStyle}`),
    },
    {
      id: 'headerControlStyle',
      label: t('headerControlStyleLabel'),
      display: ({ headerControlStyle }: TLookFormValues) =>
        t(`headerControlStyleOptionLabel.${headerControlStyle}`),
    },
    {
      id: 'languageSwitcherStyle',
      label: t('languageSwitcherLabel'),
      display: ({ languageSwitcherStyle }: TLookFormValues) =>
        t(`languageSwitcherOptionLabel.${languageSwitcherStyle}`),
    },
    {
      id: 'logo',
      label: t('logoFieldLabel'),
      display: ({ logo }: TLookFormValues) => displayBrandImage(logo),
    },
    {
      id: 'favicon',
      label: t('faviconFieldLabel'),
      display: ({ favicon }: TLookFormValues) => displayBrandImage(favicon),
    },
  ];
};
