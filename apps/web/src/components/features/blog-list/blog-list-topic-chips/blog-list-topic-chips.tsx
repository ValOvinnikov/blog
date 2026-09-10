import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTopicsSafely } from '@web/utils/get-topics-safely';

export type TBlogListTopicChipsProps = {
  tenant: string;
};

/** BlogListTopicChips — the blog index's topic-archive navigation row. */
export const BlogListTopicChips = async ({
  tenant,
}: TBlogListTopicChipsProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const topics = await getTopicsSafely(tenantContext);

  return <TopicChipList topics={topics} />;
};
