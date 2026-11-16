import type { TMaybeUndefined } from '@shinefold/config';
import type { TTag } from '@shinefold/service/shared/transformers/tag/to-tag';

export type TTagWithPostCount = TTag & {
  description: TMaybeUndefined<string>;
  postCount: number;
};

export type TTagsList = TTagWithPostCount[];
