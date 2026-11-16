import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TPostCard } from '@shinefold/service/shared/transformers/post/to-post-card';

export type TPostById = TPostCard & { language: TLocaleIsoCode };
