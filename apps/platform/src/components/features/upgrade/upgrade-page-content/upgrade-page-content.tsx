import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import { getTranslations } from 'next-intl/server';

import {
  type TUpgradeBodyProps,
  UpgradeBody,
} from './components/upgrade-body/upgrade-body';

export type TUpgradePageContentProps = TUpgradeBodyProps;

export const UpgradePageContent = async (props: TUpgradePageContentProps) => {
  const t = await getTranslations('upgradePage');

  return (
    <PageStack>
      <PageHeader title={t('pageTitle')} description={t('description')} />
      <UpgradeBody {...props} />
    </PageStack>
  );
};
