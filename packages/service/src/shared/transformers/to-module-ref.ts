import type { TModuleType } from '@blog/config';

export type TRawModuleRef = {
  key: string;
  id: string;
  type: TModuleType;
};

export type TModuleRef = {
  key: string;
  type: TModuleType;
  id: string;
};

export function toModuleRef(raw: TRawModuleRef): TModuleRef {
  return {
    key: raw.key,
    id: raw.id,
    type: raw.type,
  };
}
