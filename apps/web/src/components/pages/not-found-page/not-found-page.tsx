import { ICONS } from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { notFoundPageVariants } from './not-found-page-variants';

type TNotFoundPageProps = {
  shouldFillViewport?: boolean;
};

/**
 * NotFoundPage — the centered 404 body content shared by every not-found
 * boundary; `shouldFillViewport` (default `true`) sizes it to the full viewport
 * for the two boundaries that render with no surrounding chrome, or set it
 * to `false` to instead fill the space handed to it by a layout.
 */
export const NotFoundPage = ({
  shouldFillViewport = true,
}: TNotFoundPageProps) => {
  const t = useTranslations('notFound');
  const eyebrow = t('eyebrow');
  const s = notFoundPageVariants({ shouldFillViewport });

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
