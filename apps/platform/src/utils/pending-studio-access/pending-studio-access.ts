import type { TMaybeUndefined } from '@shinefold/config';
import {
  STUDIO_ACCESS,
  type TPendingStudioAccess,
} from '@shinefold/config/constants';

const PENDING_STUDIO_ACCESS: readonly string[] = [
  STUDIO_ACCESS.INVITE_SENT,
  STUDIO_ACCESS.ACTIVATING,
  STUDIO_ACCESS.STALLED,
] satisfies readonly TPendingStudioAccess[];

export const isPendingStudioAccess = (
  access: TMaybeUndefined<string>,
): access is TPendingStudioAccess =>
  !!access && PENDING_STUDIO_ACCESS.includes(access);
