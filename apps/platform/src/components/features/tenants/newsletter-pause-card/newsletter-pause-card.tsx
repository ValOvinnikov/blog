import { ClearNewsletterPauseControl } from '@platform/components/features/tenants/newsletter-pause-card/components/clear-newsletter-pause-control/clear-newsletter-pause-control';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TNewsletterPauseCardProps = {
  tenantId: string;
  pausedAt: Date;
};

export const NewsletterPauseCard = ({
  tenantId,
  pausedAt,
}: TNewsletterPauseCardProps) => {
  const t = useTranslations('newsletterPauseCard');
  const locale = useLocale();

  return (
    <Card>
      <Card.Header
        title={t('title')}
        actions={<ClearNewsletterPauseControl tenantId={tenantId} />}
      />
      <Card.Body>
        <Text>
          {t.rich('pausedSince', {
            date: formatDate(pausedAt, locale),
            time: (chunks) => (
              <time dateTime={pausedAt.toISOString()}>{chunks}</time>
            ),
          })}
        </Text>
      </Card.Body>
    </Card>
  );
};
