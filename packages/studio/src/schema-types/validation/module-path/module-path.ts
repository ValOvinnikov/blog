export type TModuleReference = { _type?: string; _key?: string };

export const modulePath = (module: TModuleReference, index: number) =>
  module._key ? [{ _key: module._key }] : [index];
