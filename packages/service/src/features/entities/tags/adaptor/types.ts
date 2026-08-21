import type { TMaybeUndefined } from '@blog/config';
import type { TTag } from '@blog/service/shared/transformers/to-tag';

export type TTagWithPostCount = TTag & {
  description: TMaybeUndefined<string>;
  postCount: number;
};

export type TTagsList = TTagWithPostCount[];
