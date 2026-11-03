import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';

import { previewSiteAddressVariants } from './preview-site-address-variants';

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
