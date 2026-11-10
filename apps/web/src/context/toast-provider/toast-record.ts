import { TOAST_TYPE, type TToastType } from '@blog/config';
import type { IToast } from '@blog/ui/components/molecules/toast';

/** Default auto-dismiss life per type, in ms — `undefined` = sticky. */
const TOAST_DEFAULT_LIFE_MS: Partial<Record<TToastType, number>> = {
  [TOAST_TYPE.SUCCESS]: 3600,
  [TOAST_TYPE.INFO]: 3600,
  [TOAST_TYPE.WARNING]: 5000,
};

export interface IToastPayload extends Pick<
  IToast,
  'title' | 'message' | 'time' | 'action' | 'durationMs'
> {
  coalesceKey?: string;
}

export interface IToastRecord extends IToast {
  id: string;
  coalesceKey?: string;
  paused: boolean;
  count?: number;
  createdAt: number;
}

export const toPayloadFields = (
  type: TToastType,
  { title, message, time, action, durationMs }: IToastPayload,
) => ({
  type,
  title,
  message,
  time,
  action,
  durationMs: durationMs ?? TOAST_DEFAULT_LIFE_MS[type],
});
