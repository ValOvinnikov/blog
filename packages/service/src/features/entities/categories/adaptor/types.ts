import type { TCategory } from '@blog/service/shared/transformers/to-category';

export type TCategoryWithPostCount = TCategory & { postCount: number };

export type TCategoriesList = TCategoryWithPostCount[];
