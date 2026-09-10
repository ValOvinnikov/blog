import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTopicsSafely } from '@web/utils/get-topics-safely';

export type TTopicChipsProps = {
  activeSlug: string;
  tenant: string;
};

/** TopicChips — the topic archive's topic navigation row, with the current topic highlighted. */
export const TopicChips = async ({ activeSlug, tenant }: TTopicChipsProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const topics = await getTopicsSafely(tenantContext);

  return <TopicChipList topics={topics} activeSlug={activeSlug} />;
};
