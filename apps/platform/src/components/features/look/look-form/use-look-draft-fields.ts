import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { LOOK_FIELD } from '@shinefold/db/constants';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { useAccountDraftFields } from './use-account-draft-fields';
import { useButtonsDraftFields } from './use-buttons-draft-fields';
import { useFooterDraftFields } from './use-footer-draft-fields';
import { useHeaderDraftFields } from './use-header-draft-fields';
import { useStyleDraftFields } from './use-style-draft-fields';

export const useLookDraftFields = () => {
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const tHue = useTranslations('logoHueField');
  const styleDraftFields = useStyleDraftFields();
  const headerDraftFields = useHeaderDraftFields();
  const accountDraftFields = useAccountDraftFields();
  const buttonsDraftFields = useButtonsDraftFields();
  const footerDraftFields = useFooterDraftFields();
  const displayBrandImage = ({ file }: TStagedImage) =>
    isUndefined(file) ? t('brandImageUnchanged') : t('brandImagePicked');

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
        isUndefined(logoHue)
          ? tHue('followsAccent')
          : tHue('hueValue', { hue: logoHue }),
    },
    {
      id: LOOK_FIELD.COLOR_MODE,
      label: t('colorModeLabel'),
      display: ({ colorMode }: TLookFormValues) =>
        t(`colorModeOptionLabel.${colorMode}`),
    },
    ...styleDraftFields,
    ...headerDraftFields,
    ...accountDraftFields,
    ...buttonsDraftFields,
    ...footerDraftFields,
    {
      id: 'languageSwitcherStyle',
      label: t('languageSwitcherLabel'),
      display: ({ languageSwitcherStyle }: TLookFormValues) =>
        t(`languageSwitcherOptionLabel.${languageSwitcherStyle}`),
    },
    {
      id: 'brandName',
      label: t('brandNameLabel'),
      display: ({ brandName }: TLookFormValues) =>
        brandName.trim() || t('brandNameUnset'),
    },
    {
      id: 'logo',
      label: t('logoFieldLabel'),
      display: ({ logo }: TLookFormValues) => displayBrandImage(logo),
    },
    {
      id: 'logoDark',
      label: t('logoDarkFieldLabel'),
      display: ({ logoDark }: TLookFormValues) => displayBrandImage(logoDark),
    },
    {
      id: 'favicon',
      label: t('faviconFieldLabel'),
      display: ({ favicon }: TLookFormValues) => displayBrandImage(favicon),
    },
  ];
};
