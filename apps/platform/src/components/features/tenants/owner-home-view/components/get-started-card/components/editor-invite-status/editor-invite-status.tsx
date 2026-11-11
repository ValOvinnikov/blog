import { OwnerAccessActions } from '@platform/components/features/studio/owner-access-actions';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TPendingOwnerStudioAccess } from '@platform/constants/owner-studio-access';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

export type TEditorInviteStatusProps = {
  tenantId: string;
  studioAccess: TPendingOwnerStudioAccess;
};

export const EditorInviteStatus = ({
  tenantId,
  studioAccess,
}: TEditorInviteStatusProps) => {
  const tNav = useTranslations('navSections');

  return (
    <>
      <StatusBadge tone={ownerStudioAccessTone(studioAccess)}>
        {tNav(`studioAccessLine.${studioAccess}`)}
      </StatusBadge>
      <OwnerAccessActions tenantId={tenantId} studioAccess={studioAccess} />
    </>
  );
};
