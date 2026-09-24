import { ICONS } from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Icon } from '@blog/ui/components/atoms/icon';
import { Text } from '@blog/ui/components/atoms/text';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { notFoundPageVariants } from './not-found-page-variants';

const s = notFoundPageVariants();

export const NotFoundPage = () => {
  const t = useTranslations('notFound');
  const eyebrow = t('eyebrow');

  return (
    <main className={s.root()}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={1} visual="hero">
        {t('heading')}
      </Heading>
      <Text className={s.copy()}>{t('supportingText')}</Text>
      <SmartLink href="/" className={s.link()}>
        {t('returnHome')}
        <Icon
          name={ICONS.ARROW}
          className={s.arrow()}
          dataTestId="not-found-arrow-icon"
        />
      </SmartLink>
    </main>
  );
};
