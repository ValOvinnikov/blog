import { BRAND_VARIANT, routes } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { Pagination } from '@blog/ui/organisms/pagination';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import type { IBlogListPageViewProps } from '@web/components/pages/blog-list-page';
import { PostCardItem } from '@web/components/shared/post-card-item';
import { Section } from '@web/components/shared/section';
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
      <Section
        brandVariant={BRAND_VARIANT.PRIMARY}
        titleId="blog-posts-title"
        dataTestId="post-list-module-post-list-1"
      >
        <Heading level={2} id="blog-posts-title">
          Blog posts
        </Heading>
        <PostGrid>
          <PostCardItem item={makePostListItem()} />
          <PostCardItem
            item={makePostListItem({
              id: 'post-2',
              title: 'A tour of the new editor',
              href: '/blog/a-tour-of-the-new-editor',
            })}
          />
        </PostGrid>
        <Pagination
          currentPage={1}
          totalPages={3}
          createHref={routes.blogIndex}
          ariaLabel="Blog pages"
          previousLabel="Previous"
          nextLabel="Next"
          linkAs={SmartLink}
        />
      </Section>
    ),
    ...overrides,
  };
};
