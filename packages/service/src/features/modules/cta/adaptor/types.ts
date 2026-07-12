import type { ILink } from '@blog/config';

export type TCtaModule = {
  heading: string;
  text: string | undefined;
  // Schema-required, but `toLink` can still resolve to `undefined` at runtime
  // (e.g. an internal reference whose target has no slug yet) — see toLink().
  action: ILink | undefined;
};
