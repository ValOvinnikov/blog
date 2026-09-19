import { BannerState } from '@platform/components/shared/banner-state';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useTranslations } from 'next-intl';

export type TArchivedTenantNoticeProps = {
  archivedAt: Date;
  id?: string;
};

export const ArchivedTenantNotice = ({
  archivedAt,
  id,
}: TArchivedTenantNoticeProps) => {
  const t = useTranslations('archivedTenantNotice');

  return (
    <BannerState
      id={id}
      tone="warn"
      role="status"
      title={t('title')}
      description={t('description', { date: formatDate(archivedAt) })}
      action={null}
    />
  );
};
