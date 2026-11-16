import type { TTopic } from '@shinefold/service/shared/transformers/topic/to-topic';

export type TTopicWithPostCount = TTopic & { postCount: number };

export type TTopicsList = TTopicWithPostCount[];
