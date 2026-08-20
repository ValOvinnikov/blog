import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TTopicWithPostCount = TTopic & { postCount: number };

export type TTopicsList = TTopicWithPostCount[];
