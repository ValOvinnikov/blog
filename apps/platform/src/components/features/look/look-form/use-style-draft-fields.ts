import { FONT_OPTIONS } from '@platform/config/fonts';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export const useStyleDraftFields = () => {
  const t = useTranslations('lookForm');

  return [
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
      id: 'headingWeight',
      label: t('headingWeightLabel'),
      display: ({ headingWeight }: TLookFormValues) =>
        t(`headingWeightOptionLabel.${headingWeight}`),
    },
    {
      id: 'headingCase',
      label: t('headingCaseLabel'),
      display: ({ headingCase }: TLookFormValues) =>
        t(`headingCaseOptionLabel.${headingCase}`),
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
      id: 'imageProportion',
      label: t('imageProportionLabel'),
      display: ({ imageProportion }: TLookFormValues) =>
        t(`imageProportionOptionLabel.${imageProportion}`),
    },
    {
      id: 'dividerWidth',
      label: t('dividerWidthLabel'),
      display: ({ dividerWidth }: TLookFormValues) =>
        t(`dividerWidthOptionLabel.${dividerWidth}`),
    },
    {
      id: 'cardStyle',
      label: t('cardStyleLabel'),
      display: ({ cardStyle }: TLookFormValues) =>
        t(`cardStyleOptionLabel.${cardStyle}`),
    },
  ];
};
