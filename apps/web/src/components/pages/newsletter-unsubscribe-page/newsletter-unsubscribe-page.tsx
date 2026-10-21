import { routes } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { MessagePage } from '@web/components/page-templates/message-page';
import { SmartLink } from '@web/components/shared/smart-link';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTranslations } from 'next-intl/server';

export interface INewsletterUnsubscribePageProps {
  token: string;
}

export const NewsletterUnsubscribePage = async ({
  token,
}: INewsletterUnsubscribePageProps) => {
  const [{ locale }, t] = await Promise.all([
    getRequestContext(),
    getTranslations('newsletterUnsubscribe'),
  ]);

  return (
    <MessagePage title={t('confirmTitle')} message={t('confirmMessage')}>
      <form
        method="post"
        action={routes.newsletterUnsubscribe(token, locale)}
        data-testid="newsletter-unsubscribe-form"
      >
        <Button type="submit">{t('confirmButtonLabel')}</Button>
      </form>
      <LinkButton as={SmartLink} href={routes.home()} variant="ghost">
        {t('returnHome')}
      </LinkButton>
    </MessagePage>
  );
};
