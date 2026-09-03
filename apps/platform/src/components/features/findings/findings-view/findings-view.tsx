import type { TFinding } from '@blog/db/schema/findings';
import { FindingsTable } from '@platform/components/features/findings/findings-table';
import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';

import { findingsViewVariants } from './findings-view-variants';

export type TFindingsViewProps = {
  findings: TFinding[];
  tenantNamesById: Record<string, string>;
};

/**
 * The platform-wide Findings page body: every currently open finding across
 * every tenant, including ones with no tenant reference.
 */
export const FindingsView = ({
  findings,
  tenantNamesById,
}: TFindingsViewProps) => {
  const t = useTranslations('findingsView');
  const { root } = findingsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <FindingsTable findings={findings} tenantNamesById={tenantNamesById} />
    </div>
  );
};
