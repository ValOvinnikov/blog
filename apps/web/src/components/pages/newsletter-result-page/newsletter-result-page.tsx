import { routes, type TNewsletterResult } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { tv } from '@blog/ui/lib/styling';
import { SmartLink } from '@web/components/shared/smart-link';
import { NEWSLETTER_RESULT_MESSAGES } from '@web/utils/newsletter-result-messages';
import { useTranslations } from 'next-intl';

const s = tv({
  slots: {
    root: [
      'mx-auto w-full max-w-page',
      'flex flex-col items-center gap-6',
      'px-gutter py-page-y text-center',
    ],
    copy: ['max-w-copy'],
  },
})();

export interface INewsletterResultPageProps {
  result: TNewsletterResult;
}

export const NewsletterResultPage = ({
  result,
}: INewsletterResultPageProps) => {
  const { namespace, title, message } = NEWSLETTER_RESULT_MESSAGES[result];
  const t = useTranslations(namespace);

  return (
    <main className={s.root()}>
      <Heading level={1} visual="page">
        {t(title)}
      </Heading>
      <Text className={s.copy()}>{t(message)}</Text>
      <LinkButton as={SmartLink} href={routes.home()}>
        {t('returnHome')}
      </LinkButton>
    </main>
  );
};
