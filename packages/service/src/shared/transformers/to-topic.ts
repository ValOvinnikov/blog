import type { TMaybeUndefined } from '@blog/config';
import type { topicFragment } from '@blog/service/shared/fragments/topic';
import type { InferFragmentType } from 'groqd';

export type TRawTopic = InferFragmentType<typeof topicFragment>;

export type TTopic = {
  id: string;
  title: string;
  slug: string;
  description: TMaybeUndefined<string>;
};

export function toTopic(raw: TRawTopic): TTopic {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? undefined,
  };
}
