import { routes, type TNewsletterResult } from '@shinefold/config';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import { MessagePage } from '@web/components/page-templates/message-page';
import { SmartLink } from '@web/components/shared/smart-link';
import { NEWSLETTER_RESULT_MESSAGES } from '@web/utils/newsletter-result-messages';
import { useTranslations } from 'next-intl';

export interface INewsletterResultPageProps {
  result: TNewsletterResult;
}

export const NewsletterResultPage = ({
  result,
}: INewsletterResultPageProps) => {
  const { namespace, title, message } = NEWSLETTER_RESULT_MESSAGES[result];
  const t = useTranslations(namespace);

  return (
    <MessagePage title={t(title)} message={t(message)}>
      <LinkButton as={SmartLink} href={routes.home()}>
        {t('returnHome')}
      </LinkButton>
    </MessagePage>
  );
};
