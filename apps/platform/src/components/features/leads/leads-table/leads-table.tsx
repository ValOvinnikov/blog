import type { TListedLead } from '@blog/db/queries/leads';
import { DeleteLeadControl } from '@platform/components/features/leads/leads-table/components/delete-lead-control';
import { LeadMessage } from '@platform/components/features/leads/leads-table/components/lead-message';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { useLocale, useTranslations } from 'next-intl';

import { leadsTableVariants } from './leads-table-variants';

const HOME_PATH = '/';

export type TLeadsTableProps = {
  leads: TListedLead[];
};

export const LeadsTable = ({ leads }: TLeadsTableProps) => {
  const t = useTranslations('leadsTable');
  const tView = useTranslations('leadsView');
  const locale = useLocale();
  const { visuallyHidden, received, email, sourcePath } = leadsTableVariants();

  return (
    <DataTableShell
      items={leads}
      emptyMessage={t('empty')}
      ariaLabel={tView('title')}
      columns={[
        { key: 'received', label: t('columnReceived') },
        { key: 'name', label: t('columnName') },
        { key: 'email', label: t('columnEmail') },
        { key: 'message', label: t('columnMessage') },
        { key: 'page', label: t('columnPage') },
        {
          key: 'actions',
          label: <span className={visuallyHidden()}>{t('columnActions')}</span>,
        },
      ]}
      renderRow={(lead) => (
        <DataTableShell.Row key={lead.id}>
          <DataTableShell.Cell>
            <time
              className={received()}
              dateTime={lead.createdAt.toISOString()}
            >
              {formatDateTime(lead.createdAt.toISOString(), locale)}
            </time>
          </DataTableShell.Cell>
          <DataTableShell.Cell>{lead.name}</DataTableShell.Cell>
          <DataTableShell.Cell>
            <a className={email()} href={`mailto:${lead.email}`}>
              {lead.email}
            </a>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <LeadMessage message={lead.message} />
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <span className={sourcePath()}>
              {lead.sourcePath === HOME_PATH ? t('homePage') : lead.sourcePath}
            </span>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <DeleteLeadControl leadId={lead.id} leadName={lead.name} />
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />
  );
};
