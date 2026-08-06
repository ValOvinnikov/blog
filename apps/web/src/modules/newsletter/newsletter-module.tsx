import { service } from '@blog/service';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { getTranslations } from 'next-intl/server';

export interface INewsletterModuleProps {
  id: string;
  locale: string;
}

/**
 * NewsletterModule — fetches `module_newsletter` data and renders it through
 * the `NewsletterForm` client island (`full` density), the only place this
 * module's service and ui meet. `heading`/`description` are both optional in
 * the CMS schema ("falls back to a default if left empty") — an empty string
 * or `undefined` field falls back to the same default copy the site footer
 * uses (`newsletterForm` messages), so the module never renders blank.
 */
export async function NewsletterModule({ id }: INewsletterModuleProps) {
  const result = await service.modules.newsletter.v1.getNewsletter(id);

  if (!result.ok) return null;

  const { heading, description } = result.data;
  const t = await getTranslations('newsletterForm');

  return (
    <NewsletterForm
      variant="full"
      heading={heading || t('heading')}
      description={description || t('description')}
    />
  );
}
