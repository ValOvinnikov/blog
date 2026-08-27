import { BRAND_VARIANT, HEADING_ALIGN } from '@blog/config';
import { Pagination } from '@blog/ui/organisms/pagination';
import { PostsSection } from '@blog/ui/organisms/posts-section';
import type { ITopicPageViewProps } from '@web/components/pages/topic-page';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'News', href: '/topics/news' },
];

export const makeTopicPageView = (
  overrides: Partial<ITopicPageViewProps> = {},
): ITopicPageViewProps => {
  return {
    heading: 'News',
    supportingText: 'The latest updates.',
    topics: [
      makeTopicWithPostCount({ title: 'News', slug: 'news', postCount: 1 }),
      makeTopicWithPostCount({
        id: 'topic-2',
        title: 'Design',
        slug: 'design',
        postCount: 2,
      }),
    ],
    activeSlug: 'news',
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(
      DEFAULT_TRAIL,
      'https://example.com',
    ),
    postsContent: (
      <Section
        brandVariant={BRAND_VARIANT.PRIMARY}
        titleId="topic-posts-title"
        dataTestId="post-list-module-post-list-1"
      >
        <PostsSection
          posts={[
            makePostListItem(),
            makePostListItem({
              id: 'post-2',
              title: 'A tour of the new editor',
              href: '/blog/a-tour-of-the-new-editor',
            }),
          ]}
          titleId="topic-posts-title"
          accessibleTitle="Posts in News"
          align={HEADING_ALIGN.LEFT}
          linkAs={SmartLink}
          isWrapped={true}
          emptyMessage="No posts in News yet."
        />
        <Pagination
          currentPage={1}
          totalPages={3}
          createHref={(page) =>
            page === 1 ? '/topics/news' : `/topics/news/page/${page}`
          }
          ariaLabel="News pages"
          previousLabel="Previous"
          nextLabel="Next"
          linkAs={SmartLink}
        />
      </Section>
    ),
    ...overrides,
  };
};
