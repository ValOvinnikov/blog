import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

export type TPostById = TPostCard & { language: TLocaleIsoCode };
