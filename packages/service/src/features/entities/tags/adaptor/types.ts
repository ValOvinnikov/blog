import type { TTag } from '@blog/service/shared/transformers/to-tag';

export type TTagWithPostCount = TTag & { postCount: number };

export type TTagsList = TTagWithPostCount[];
