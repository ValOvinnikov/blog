import type { TTopic } from '@blog/service/shared/transformers/topic/to-topic/to-topic';

export type TTopicWithPostCount = TTopic & { postCount: number };

export type TTopicsList = TTopicWithPostCount[];
