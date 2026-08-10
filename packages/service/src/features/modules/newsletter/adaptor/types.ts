import type { TAppearance, TMaybeUndefined } from '@blog/config';

export type TNewsletterModule = {
  heading: string;
  description: TMaybeUndefined<string>;
  appearance: TMaybeUndefined<TAppearance>;
};
