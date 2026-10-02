import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTopicsSafely } from '@web/utils/get-topics-safely';

export type TTopicChipsProps = {
  activeSlug: string;
};

export const TopicChips = async ({ activeSlug }: TTopicChipsProps) => {
  const { sanityContext } = await getRequestContext();
  const topics = await getTopicsSafely(sanityContext);

  return <TopicChipList topics={topics} activeSlug={activeSlug} />;
};
