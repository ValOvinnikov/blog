import type { ILink } from '@blog/config';

export type TCtaModule = {
  heading: string;
  text: string | undefined;
  action: ILink | undefined;
};
