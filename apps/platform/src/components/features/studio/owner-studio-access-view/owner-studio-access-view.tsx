import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import { useTranslations } from 'next-intl';

import { OwnerAccessActions } from './components/owner-access-actions/owner-access-actions';
import { ownerStudioAccessViewVariants } from './owner-studio-access-view-variants';

export type TOwnerStudioAccessViewProps = {
  tenantId: string;
  studioAccess: Exclude<TOwnerStudioAccess, typeof OWNER_STUDIO_ACCESS.READY>;
};

export const OwnerStudioAccessView = ({
  tenantId,
  studioAccess,
}: TOwnerStudioAccessViewProps) => {
  const tStudio = useTranslations('studioPage');
  const t = useTranslations('ownerStudioAccess');
  const { root } = ownerStudioAccessViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={tStudio('title')} />
      <Alert
        type={
          studioAccess === OWNER_STUDIO_ACCESS.STALLED
            ? ALERT_TYPE.WARNING
            : ALERT_TYPE.INFO
        }
        title={t(`title.${studioAccess}`)}
        description={t(`description.${studioAccess}`)}
        action={
          <OwnerAccessActions
            tenantId={tenantId}
            canResend={studioAccess !== OWNER_STUDIO_ACCESS.ACTIVATING}
          />
        }
      />
    </div>
  );
};
