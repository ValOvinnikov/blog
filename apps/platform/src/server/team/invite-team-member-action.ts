'use server';

import {
  TEAM_ACCESS_LOG,
  TEAM_INVITE_FIELD_ERROR,
  type TTeamInviteFieldError,
} from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import {
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_ROLE,
} from '@shinefold/db/constants';
import { normalizeEmail } from '@shinefold/utils/normalize-email-identity';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { sendTeamInviteOrCancel } from './send-team-invite';
import { teamInviteInputSchema, type TTeamInviteInput } from './team-input';

export type TInviteTeamMemberResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  'email',
  TTeamInviteFieldError
>;

const REFUSED_INVITE_ERROR = {
  [MEMBERSHIP_INVITE_OUTCOME.ALREADY_PENDING]:
    TEAM_INVITE_FIELD_ERROR.ALREADY_INVITED,
  [MEMBERSHIP_INVITE_OUTCOME.ALREADY_CONSUMED]:
    TEAM_INVITE_FIELD_ERROR.ALREADY_MEMBER,
  [MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT]: TEAM_INVITE_FIELD_ERROR.SEAT_LIMIT,
} as const;

const emailError = (
  reason: TTeamInviteFieldError,
  email?: string,
): TInviteTeamMemberResult => ({
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { email: { reason, values: email ? { email } : undefined } },
});

const isMemberEmail = async (tenantId: string, email: string) =>
  (await queries.memberships.listTenantMembers(tenantId)).some(
    (member) => !!member.email && normalizeEmail(member.email) === email,
  );

export const inviteTeamMemberAction = async (
  tenantId: string,
  input: TTeamInviteInput,
): Promise<TInviteTeamMemberResult> => {
  await requireTenantManager(tenantId);

  const parsed = teamInviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return emailError(TEAM_INVITE_FIELD_ERROR.EMAIL_INVALID);
  }
  const { email } = parsed.data;

  try {
    if (await isMemberEmail(tenantId, email)) {
      return emailError(TEAM_INVITE_FIELD_ERROR.ALREADY_MEMBER, email);
    }

    const result = await queries.membershipInvites.createMembershipInvite(
      tenantId,
      email,
      MEMBERSHIP_ROLE.EDITOR,
    );
    if (result.outcome !== MEMBERSHIP_INVITE_OUTCOME.CREATED) {
      return emailError(REFUSED_INVITE_ERROR[result.outcome], email);
    }

    const { id, role } = result.invite;
    if (!(await sendTeamInviteOrCancel(tenantId, id, email))) {
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    await recordAuditEvent({
      logEvent: TEAM_ACCESS_LOG.INVITE_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_INVITED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: id,
      details: { role },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(TEAM_ACCESS_LOG.INVITE_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
