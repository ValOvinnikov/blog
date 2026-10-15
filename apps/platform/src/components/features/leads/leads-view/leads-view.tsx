import { ALERT_TYPE } from '@blog/config';
import { LeadsTable } from '@platform/components/features/leads/leads-table';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TLeadRow } from '@platform/utils/lead-row/lead-row';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { leadsViewVariants } from './leads-view-variants';

export type TLeadsViewProps = {
  leads: TLeadRow[];
  isContactFormIncluded: boolean;
  pagination: ReactNode;
};

export const LeadsView = ({
  leads,
  isContactFormIncluded,
  pagination,
}: TLeadsViewProps) => {
  const t = useTranslations('leadsView');
  const { root } = leadsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      {!isContactFormIncluded && (
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('downgradedTitle')}
          description={t('downgradedDescription')}
        />
      )}
      <LeadsTable leads={leads} />
      {pagination}
    </div>
  );
};
