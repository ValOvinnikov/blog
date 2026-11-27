import { useTranslations } from 'next-intl';

import { newTabHintVariants } from './new-tab-hint-variants';

export const NewTabHint = () => {
  const t = useTranslations('externalLink');

  return <span className={newTabHintVariants()}>{t('newTabHint')}</span>;
};
