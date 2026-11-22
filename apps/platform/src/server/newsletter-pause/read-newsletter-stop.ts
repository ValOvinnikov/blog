import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { EMAIL_REPUTATION_LEVEL } from '@shinefold/db/constants';
import { emailReputationLevel } from '@shinefold/db/utils/email-reputation-level/email-reputation-level';

export type TNewsletterStop = {
  isStopped: boolean;
  pausedAt: TMaybeUndefined<Date>;
};

export const readNewsletterStop = async (
  tenantId: string,
): Promise<TNewsletterStop> => {
  const [pausedAt, reputation] = await Promise.all([
    queries.emailConfig.getNewsletterPausedAt(tenantId),
    queries.emailUsage.getEmailReputation(tenantId),
  ]);
  return {
    isStopped:
      Boolean(pausedAt) ||
      emailReputationLevel(reputation) === EMAIL_REPUTATION_LEVEL.STOP,
    pausedAt,
  };
};
