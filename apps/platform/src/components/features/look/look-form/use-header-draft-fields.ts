import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export const useHeaderDraftFields = () => {
  const t = useTranslations('lookForm');

  return [
    {
      id: 'headerLayout',
      label: t('headerLayoutLabel'),
      display: ({ headerLayout }: TLookFormValues) =>
        t(`headerLayoutOptionLabel.${headerLayout}`),
    },
    {
      id: 'headerSubmenuStyle',
      label: t('headerSubmenuStyleLabel'),
      display: ({ headerSubmenuStyle }: TLookFormValues) =>
        t(`headerSubmenuStyleOptionLabel.${headerSubmenuStyle}`),
    },
    {
      id: 'headerBarStyle',
      label: t('headerBarStyleLabel'),
      display: ({ headerBarStyle }: TLookFormValues) =>
        t(`headerBarStyleOptionLabel.${headerBarStyle}`),
    },
    {
      id: 'navLinkStyle',
      label: t('navLinkStyleLabel'),
      display: ({ navLinkStyle }: TLookFormValues) =>
        t(`navLinkStyleOptionLabel.${navLinkStyle}`),
    },
    {
      id: 'headerControlStyle',
      label: t('headerControlStyleLabel'),
      display: ({ headerControlStyle }: TLookFormValues) =>
        t(`headerControlStyleOptionLabel.${headerControlStyle}`),
    },
    {
      id: 'headerControlShape',
      label: t('headerControlShapeLabel'),
      display: ({ headerControlShape }: TLookFormValues) =>
        t(`headerControlShapeOptionLabel.${headerControlShape}`),
    },
  ];
};
