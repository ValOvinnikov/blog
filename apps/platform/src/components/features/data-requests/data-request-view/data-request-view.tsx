import { DataRequestPanel } from '@platform/components/features/data-requests/data-request-view/components/data-request-panel/data-request-panel';
import { PageHeader } from '@platform/components/shared/page-header';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const dataRequestViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
  },
});

export const DataRequestView = () => {
  const t = useTranslations('dataRequestView');
  const { root } = dataRequestViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <DataRequestPanel />
    </div>
  );
};
