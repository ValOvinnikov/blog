import { BannerState } from '@platform/components/shared/banner-state';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useTranslations } from 'next-intl';

export type TArchivedTenantNoticeProps = {
  archivedAt: Date;
  /** Lets a disabled control elsewhere on the page point its `aria-describedby` here. */
  id?: string;
};

/** Tells an operator viewing an archived tenant's detail pages that everything here is read-only. */
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
