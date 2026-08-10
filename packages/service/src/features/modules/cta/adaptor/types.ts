import type { ILink, TAppearance, TMaybeUndefined } from '@blog/config';

export type TCtaModule = {
  heading: string;
  text: TMaybeUndefined<string>;
  action: TMaybeUndefined<ILink>;
  appearance: TMaybeUndefined<TAppearance>;
};
