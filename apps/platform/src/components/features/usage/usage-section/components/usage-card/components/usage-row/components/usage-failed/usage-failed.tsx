import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { ICONS } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { usageFailedVariants } from './usage-failed-variants';

export const UsageFailed = () => {
  const t = useTranslations('usageCard');
  const { root, icon, message } = usageFailedVariants();

  return (
    <div className={root()}>
      <Icon
        name={ICONS.WARNING}
        size={ICON_SIZE.MD}
        strokeWidth={ICON_STROKE_WIDTH.CONTROL}
        className={icon()}
      />
      <p className={message()}>{t('failed')}</p>
    </div>
  );
};
