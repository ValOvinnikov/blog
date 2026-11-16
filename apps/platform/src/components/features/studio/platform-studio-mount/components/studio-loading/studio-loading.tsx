import { Spinner } from '@platform/components/shared/spinner';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { studioLoadingVariants } from './studio-loading-variants';

export const StudioLoading = () => {
  const t = useTranslations('studioPage');
  const { root } = studioLoadingVariants();

  return (
    <div className={root()}>
      <Spinner label={t('loading')} size={SIZE.LG} hasLabel={true} />
    </div>
  );
};
