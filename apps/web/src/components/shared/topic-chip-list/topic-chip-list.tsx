import { routes } from '@blog/config';
import type { TTopicsList } from '@blog/service';
import { Tag } from '@blog/ui/components/atoms/tag';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { topicChipListVariants } from './topic-chip-list-variants';

export interface ITopicChipListProps {
  topics: TTopicsList;
  activeSlug?: string;
}

/**
 * Every link is a real `<a>` via `SmartLink` — SEO navigation, not a
 * client-side filter.
 */
export const TopicChipList = ({ topics, activeSlug }: ITopicChipListProps) => {
  const t = useTranslations('topicChipList');

  if (topics.length === 0) return null;

  const isAllActive = activeSlug === undefined;

  return (
    <nav aria-label={t('ariaLabel')} className={topicChipListVariants()}>
      <Tag
        as={SmartLink}
        href={routes.blogIndex()}
        variant={isAllActive ? 'accent' : 'default'}
        aria-current={isAllActive ? 'page' : undefined}
      >
        {t('all')}
      </Tag>
      {topics.map((topic) => {
        const isActive = topic.slug === activeSlug;

        return (
          <Tag
            key={topic.id}
            as={SmartLink}
            href={routes.topic(topic.slug)}
            variant={isActive ? 'accent' : 'default'}
            aria-current={isActive ? 'page' : undefined}
          >
            {topic.title}
          </Tag>
        );
      })}
    </nav>
  );
};
