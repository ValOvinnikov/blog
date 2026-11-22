import { OwnerAccessActions } from '@platform/components/shared/owner-access-actions';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';
import type { TPendingStudioAccess } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export type TEditorInviteStatusProps = {
  tenantId: string;
  studioAccess: TPendingStudioAccess;
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
