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
      {topics.map(({ id, title, slug }) => {
        if (!slug) return <Tag key={id}>{title}</Tag>;

        const isActive = slug === activeSlug;

        return (
          <Tag
            key={id}
            as={SmartLink}
            href={routes.topic(slug)}
            variant={isActive ? 'accent' : 'default'}
            aria-current={isActive ? 'page' : undefined}
          >
            {title}
          </Tag>
        );
      })}
    </nav>
  );
};
