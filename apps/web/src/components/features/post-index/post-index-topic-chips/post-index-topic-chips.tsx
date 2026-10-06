import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTopicsSafely } from '@web/utils/get-topics-safely';

export const PostIndexTopicChips = async () => {
  const { sanityContext } = await getRequestContext();
  const topics = await getTopicsSafely(sanityContext);

  return <TopicChipList topics={topics} />;
};
