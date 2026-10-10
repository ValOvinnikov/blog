import type { TOpenFinding } from '@blog/db/queries/findings';
import { FindingsTable } from '@platform/components/features/findings/findings-table';
import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';

import { findingsViewVariants } from './findings-view-variants';

export type TFindingsViewProps = {
  findings: TOpenFinding[];
};

export const FindingsView = ({ findings }: TFindingsViewProps) => {
  const t = useTranslations('findingsView');
  const { root } = findingsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <FindingsTable findings={findings} />
    </div>
  );
};
