import type { TModuleType } from '@blog/config';
import type { moduleFragment } from '@blog/service/shared/fragments/module';
import type { InferFragmentType } from 'groqd';

export type TRawModuleRef = InferFragmentType<typeof moduleFragment>;

export type TModuleRef = {
  id: string;
  type: TModuleType;
};

export function toModuleRef(raw: TRawModuleRef): TModuleRef {
  return {
    id: raw._id,
    type: raw._type,
  };
}
