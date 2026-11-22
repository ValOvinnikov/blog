import { Alert } from '@platform/components/shared/alert';
import { OwnerAccessActions } from '@platform/components/shared/owner-access-actions';
import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import { contentColumnClasses } from '@platform/utils/content-column-classes/content-column-classes';
import { ALERT_TYPE } from '@shinefold/config';
import {
  STUDIO_ACCESS,
  type TPendingStudioAccess,
} from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export type TStudioAccessViewProps = {
  tenantId: string;
  studioAccess: TPendingStudioAccess;
};

export const OwnerStudioAccessView = ({
  tenantId,
  studioAccess,
}: TStudioAccessViewProps) => {
  const tStudio = useTranslations('studioPage');
  const t = useTranslations('ownerStudioAccess');

  return (
    <PageStack className={contentColumnClasses()}>
      <PageHeader title={tStudio('title')} />
      <Alert
        type={
          studioAccess === STUDIO_ACCESS.STALLED
            ? ALERT_TYPE.WARNING
            : ALERT_TYPE.INFO
        }
        title={t(`title.${studioAccess}`)}
        description={t(`description.${studioAccess}`)}
        action={
          <OwnerAccessActions tenantId={tenantId} studioAccess={studioAccess} />
        }
      />
    </PageStack>
  );
};
