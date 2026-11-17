import { Alert } from '@platform/components/shared/alert';
import { OwnerAccessActions } from '@platform/components/shared/owner-access-actions';
import { PageHeader } from '@platform/components/shared/page-header';
import { ALERT_TYPE } from '@shinefold/config';
import {
  STUDIO_ACCESS,
  type TPendingStudioAccess,
} from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

import { ownerStudioAccessViewVariants } from './owner-studio-access-view-variants';

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
  const { root } = ownerStudioAccessViewVariants();

  return (
    <div className={root()}>
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
    </div>
  );
};
