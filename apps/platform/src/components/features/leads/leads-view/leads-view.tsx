import { ALERT_TYPE } from '@blog/config';
import { LeadsInbox } from '@platform/components/features/leads/leads-inbox';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TInboxLeadsPage } from '@platform/server/leads/list-inbox-leads';
import { useTranslations } from 'next-intl';

import { leadsViewVariants } from './leads-view-variants';

export type TLeadsViewProps = {
  initialPage: TInboxLeadsPage;
  isContactFormIncluded: boolean;
};

export const LeadsView = ({
  initialPage,
  isContactFormIncluded,
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
      <LeadsInbox initialPage={initialPage} />
    </div>
  );
};
