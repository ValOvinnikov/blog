import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TArchivedTenantNoticeProps = {
  archivedAt: Date;
  id?: string;
};

export const ArchivedTenantNotice = ({
  archivedAt,
  id,
}: TArchivedTenantNoticeProps) => {
  const t = useTranslations('archivedTenantNotice');
  const locale = useLocale();

  return (
    <Alert
      id={id}
      type={ALERT_TYPE.WARNING}
      title={t('title')}
      description={t('description', { date: formatDate(archivedAt, locale) })}
    />
  );
};
