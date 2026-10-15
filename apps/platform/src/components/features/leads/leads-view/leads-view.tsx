import { LeadsPagination } from '@platform/components/features/leads/leads-pagination';
import { LeadsTable } from '@platform/components/features/leads/leads-table';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TLeadRow } from '@platform/utils/lead-row/lead-row';
import { useTranslations } from 'next-intl';

import { leadsViewVariants } from './leads-view-variants';

export type TLeadsViewProps = {
  tenantId: string;
  leads: TLeadRow[];
  page: number;
  totalPages: number;
};

export const LeadsView = ({
  tenantId,
  leads,
  page,
  totalPages,
}: TLeadsViewProps) => {
  const t = useTranslations('leadsView');
  const { root } = leadsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <LeadsTable tenantId={tenantId} leads={leads} />
      <LeadsPagination page={page} totalPages={totalPages} />
    </div>
  );
};
