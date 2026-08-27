import { PostsSection } from '@blog/ui/organisms/posts-section';
import type { IBlogListPageViewProps } from '@web/components/pages/blog-list-page';
import { SmartLink } from '@web/components/shared/smart-link';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
];

export const makeBlogListPageView = (
  overrides: Partial<IBlogListPageViewProps> = {},
): IBlogListPageViewProps => {
  return {
    heading: 'Blog',
    supportingText: 'Essays and notes on building this site.',
    topics: [
      makeTopicWithPostCount({
        id: 'topic-1',
        title: 'Engineering',
        slug: 'engineering',
      }),
      makeTopicWithPostCount({
        id: 'topic-2',
        title: 'Product',
        slug: 'product',
      }),
    ],
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(
      DEFAULT_TRAIL,
      'https://example.com',
    ),
    postsContent: (
      <PostsSection
        posts={[
          makePostListItem(),
          makePostListItem({
            id: 'post-2',
            title: 'A tour of the new editor',
            href: '/blog/a-tour-of-the-new-editor',
          }),
        ]}
        title="Latest posts"
        titleId="blog-posts-title"
        linkAs={SmartLink}
      />
    ),
    ...overrides,
  };
};
