import type { TMaybeUndefined } from '@shinefold/config';
import type { topicFragment } from '@shinefold/service/shared/fragments/topic/topic';
import type { InferFragmentType } from 'groqd';

export type TRawTopic = InferFragmentType<typeof topicFragment>;

export type TTopic = {
  id: string;
  title: string;
  slug: TMaybeUndefined<string>;
  description: TMaybeUndefined<string>;
};

export function toTopic(raw: TRawTopic): TTopic {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug ?? undefined,
    description: raw.description ?? undefined,
  };
}
