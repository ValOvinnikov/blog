import type { RichText, TAppearance, TMaybeUndefined } from '@blog/config';

export type TContentModule = {
  title: string;
  body: RichText;
  appearance: TMaybeUndefined<TAppearance>;
};
