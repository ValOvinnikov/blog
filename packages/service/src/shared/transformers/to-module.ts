import {
  isHeroModuleType,
  type THeroModuleType,
  type TMaybeUndefined,
  type TModuleType,
} from '@blog/config';

export type TRawModule<T extends TModuleType = TModuleType> = {
  _id: string;
  _type: T;
};

export type TModule<T extends TModuleType = TModuleType> = {
  id: string;
  type: T;
};

export function toModule<T extends TModuleType = TModuleType>(
  raw: TRawModule<T>,
): TModule<T> {
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

export function toHeroSlot<T extends THeroModuleType = THeroModuleType>(
  raw: TRawModule<T> | null | undefined,
): TMaybeUndefined<TModule<T>> {
  if (!raw) return undefined;

  if (!isHeroModuleType(raw._type)) {
    throw new InvalidHeroModuleTypeError(raw._type);
  }

  return {
    id: raw._id,
    type: raw._type,
  };
}
