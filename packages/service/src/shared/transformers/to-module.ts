import type { TModuleType } from '@blog/config';
import type { moduleFragment } from '@blog/service/shared/fragments/module';
import type { InferFragmentType } from 'groqd';

export type TRawModule = InferFragmentType<typeof moduleFragment>;

export type TModule = {
  id: string;
  type: TModuleType;
};

export function toModule(raw: TRawModule): TModule {
  return {
    id: raw._id,
    type: raw._type,
  };
}
