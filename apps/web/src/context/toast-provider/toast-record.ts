import { TOAST_TYPE, type TToastType } from '@shinefold/config';
import type { IToast } from '@shinefold/ui/components/molecules/toast';

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

type TToastPromiseMessage<T> = IToastPayload | ((value: T) => IToastPayload);

export interface IToastPromiseMessages<T> {
  loading: Pick<IToastPayload, 'title' | 'message'>;
  success: TToastPromiseMessage<T>;
  error: TToastPromiseMessage<unknown>;
}

export const resolvePayload = <T>(
  message: TToastPromiseMessage<T>,
  value: T,
): IToastPayload => (typeof message === 'function' ? message(value) : message);
