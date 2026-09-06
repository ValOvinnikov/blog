import { ICONS } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { notFoundPageVariants } from './not-found-page-variants';

const s = notFoundPageVariants();

/**
 * NotFoundPage — the 404 body content. Rendered from the root
 * `not-found.tsx`, which sits outside the `[tenant]/[locale]` route tree
 * (this app's `Header`/`Footer` chrome lives in `[tenant]/[locale]/layout.tsx`),
 * so this stays a self-contained, centered composition: an optional eyebrow,
 * the page heading, supporting text, and a link home.
 */
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
