import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const previewSiteAddressVariants = tv({
  slots: {
    root: ['inline-flex min-w-0 max-w-full items-center gap-1.5'],
    icon: ['text-admin-muted'],
    label: ['sr-only'],
    address: [
      'min-w-0 truncate font-admin-mono text-admin-12 leading-[18px] font-medium text-admin-text',
    ],
  },
});

export type TPreviewSiteAddressProps = {
  address: string;
};

export const PreviewSiteAddress = ({ address }: TPreviewSiteAddressProps) => {
  const t = useTranslations('onboardingForm');
  const {
    root,
    icon,
    label,
    address: addressSlot,
  } = previewSiteAddressVariants();

  return (
    <span className={root()}>
      <Icon name={ICONS.GLOBE} size={ICON_SIZE.XS} className={icon()} />
      <span className={label()}>{`${t('siteAddressLabel')} `}</span>
      <span className={addressSlot()}>{address}</span>
    </span>
  );
};
