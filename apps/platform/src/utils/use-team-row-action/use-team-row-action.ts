'use client';

import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import {
  TEAM_REFUSAL,
  type TTeamRefusal,
} from '@platform/constants/team-access';
import { useToast } from '@platform/context/toast-provider';
import type { TTeamRefusalResult } from '@platform/server/team/team-refusal';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  type TMaybeUndefined,
  isOutcomeRefused,
  isOutcomeSuccess,
} from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type TTeamRowActionMessages = {
  done: string;
  gone: string;
  failed: string;
  refused?: Partial<Record<TTeamRefusal, string>>;
};

export const useTeamRowAction = ({
  done,
  gone,
  failed,
  refused = {},
}: TTeamRowActionMessages) => {
  const toast = useToast();
  const router = useRouter();
  const announce = useRef<TMaybeUndefined<() => void>>(undefined);

  const onConfirm = async (
    request: Promise<TTeamRefusalResult>,
  ): Promise<TConfirmDialogActionResult> => {
    const result = await settleAction(request);
    if (isOutcomeSuccess(result)) {
      announce.current = () => toast.success({ message: done });
      return okResult();
    }
    if (isOutcomeRefused(result)) {
      if (result.reason === TEAM_REFUSAL.NOT_FOUND) {
        announce.current = () => toast.info({ message: gone });
        return okResult();
      }
      const refusal = refused[result.reason];
      if (refusal) return errorResult(refusal);
    }
    return errorResult(failed);
  };

  const onConfirmed = () => {
    announce.current?.();
    router.refresh();
  };

  return { onConfirm, onConfirmed };
};
