import type { TModuleKind } from '@shinefold/config/types';

type TSanitySystemField = '_createdAt' | '_updatedAt' | '_rev';

export type TStarterDocument<
  TDocument extends { _id: string; _type: string },
  TRequiredField extends keyof TDocument,
> = Omit<TDocument, TSanitySystemField> &
  Required<Pick<TDocument, TRequiredField>>;

type TStarterModuleSlot<TTemplate extends { modules?: readonly unknown[] }> = {
  _key: string;
  _ref: string;
  _type: TModuleKind<TTemplate>;
};

export type TStarterTemplate<
  TTemplate extends {
    _id: string;
    _type: string;
    title?: string;
    modules?: readonly unknown[];
  },
> = Omit<TStarterDocument<TTemplate, 'title'>, 'modules'> & {
  modules?: TStarterModuleSlot<TTemplate>[];
};
