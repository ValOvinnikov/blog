import {
  isHeroModuleType,
  type THeroModuleType,
  type TMaybeUndefined,
  type TModuleType,
} from '@blog/config';
import type { moduleFragment } from '@blog/service/shared/fragments/module';
import type { InferFragmentType } from 'groqd';

export type TRawModule = InferFragmentType<typeof moduleFragment>;

export type TModule<T extends TModuleType = TModuleType> = {
  id: string;
  type: T;
};

export function toModule(raw: TRawModule): TModule {
  return {
    id: raw._id,
    type: raw._type,
  };
}

export class InvalidHeroModuleTypeError extends Error {
  readonly code = 'INVALID_HERO_MODULE_TYPE' as const;

  constructor(type: string) {
    super(`Hero slot's _type "${type}" is not a module_hero* type`);
  }
}

export function toHeroSlot(
  raw: TRawModule | null | undefined,
): TMaybeUndefined<TModule<THeroModuleType>> {
  if (!raw) return undefined;

  if (!isHeroModuleType(raw._type)) {
    throw new InvalidHeroModuleTypeError(raw._type);
  }

  return {
    id: raw._id,
    type: raw._type,
  };
}
