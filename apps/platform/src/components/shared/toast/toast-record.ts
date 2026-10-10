import type { TToastType } from '@blog/config';
import type { ReactNode } from 'react';

interface IToastAction {
  label: string;
  onAct: () => void;
  keyHint?: string;
}

export interface IToastPayload {
  title?: string;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  durationMs?: number;
  coalesceKey?: string;
}

type TToastPhase = 'entering' | 'visible' | 'leaving';

export interface IToastRecord extends IToastPayload {
  id: string;
  type: TToastType;
  isLoading?: boolean;
  phase: TToastPhase;
  paused: boolean;
  count?: number;
  createdAt: number;
}
