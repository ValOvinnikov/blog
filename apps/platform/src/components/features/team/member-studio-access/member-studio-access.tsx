import { OwnerAccessActions } from '@platform/components/shared/owner-access-actions';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import {
  TEAM_ROW_ACCESS,
  type TTeamRowAccess,
} from '@platform/constants/team-access';
import { isPendingStudioAccess } from '@platform/utils/pending-studio-access/pending-studio-access';
import type { TBadgeTone } from '@platform/utils/status-tone/status-tone';
import type { TTeamMemberRow } from '@platform/utils/team-view-model/team-view-model';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { memberStudioAccessVariants } from './member-studio-access-variants';

const ACCESS_BADGE_TONE: Record<
  Exclude<TTeamRowAccess, typeof TEAM_ROW_ACCESS.NO_ACCESS>,
  TBadgeTone
> = {
  [TEAM_ROW_ACCESS.READY]: BADGE_TONE.OK,
  [TEAM_ROW_ACCESS.INVITE_SENT]: BADGE_TONE.BRAND,
  [TEAM_ROW_ACCESS.ACTIVATING]: BADGE_TONE.NEUTRAL,
  [TEAM_ROW_ACCESS.STALLED]: BADGE_TONE.WARN,
  [TEAM_ROW_ACCESS.LOCKED]: BADGE_TONE.WARN,
};

export type TMemberStudioAccessProps = {
  tenantId: string;
  member: TTeamMemberRow;
};

export const MemberStudioAccess = ({
  tenantId,
  member,
}: TMemberStudioAccessProps) => {
  const t = useTranslations('teamPage.studioAccess');
  const { membershipId, email, role, access, canRequestAccess } = member;
  const { root, status, hint } = memberStudioAccessVariants();
  const isNoAccess = access === TEAM_ROW_ACCESS.NO_ACCESS;
  const hasHint = access !== TEAM_ROW_ACCESS.READY;

  return (
    <div className={root()}>
      <div className={status()}>
        {!isNoAccess && (
          <StatusBadge tone={ACCESS_BADGE_TONE[access]}>
            {t(`badge.${access}`)}
          </StatusBadge>
        )}
        {hasHint && (
          <span className={hint()}>
            {isNoAccess ? t('noAccess') : t(`hint.${access}`)}
          </span>
        )}
      </div>
      {canRequestAccess && isPendingStudioAccess(access) && (
        <OwnerAccessActions
          tenantId={tenantId}
          studioAccess={access}
          membershipId={
            role === MEMBERSHIP_ROLE.OWNER ? undefined : membershipId
          }
          email={email}
        />
      )}
    </div>
  );
};
