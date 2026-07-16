import type { ILink, TMaybeUndefined } from '@blog/config';

export type TCtaModule = {
  heading: string;
  text: TMaybeUndefined<string>;
  action: TMaybeUndefined<ILink>;
};
