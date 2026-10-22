import { AddBlockedDomainCard } from '@platform/components/features/blocked-signups/blocked-signups-view/components/add-blocked-domain-card/add-blocked-domain-card';
import { BlockedSignupsTable } from '@platform/components/features/blocked-signups/blocked-signups-view/components/blocked-signups-table/blocked-signups-table';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const blockedSignupsViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
  },
});

export type TBlockedSignupsViewProps = {
  entries: TBlockedSignupEntry[];
};

export const BlockedSignupsView = ({ entries }: TBlockedSignupsViewProps) => {
  const t = useTranslations('blockedSignupsView');
  const { root } = blockedSignupsViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <AddBlockedDomainCard />
      <BlockedSignupsTable entries={entries} />
    </div>
  );
};
