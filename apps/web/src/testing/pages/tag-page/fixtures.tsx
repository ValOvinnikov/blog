import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import { Pagination } from '@blog/ui/organisms/pagination';
import { PostsSection } from '@blog/ui/organisms/posts-section';
import type { ITagPageViewProps } from '@web/components/pages/tag-page';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'TypeScript', href: '/tags/typescript' },
];

export const makeTagPageView = (
  overrides: Partial<ITagPageViewProps> = {},
): ITagPageViewProps => {
  return {
    heading: 'TypeScript',
    supportingText: 'Posts about TypeScript.',
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(
      DEFAULT_TRAIL,
      'https://example.com',
    ),
    postsContent: (
      <Section
        brandVariant={BRAND_VARIANT.PRIMARY}
        titleId="tag-posts-title"
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
          titleId="tag-posts-title"
          accessibleTitle="Posts tagged TypeScript"
          align={CONTENT_ALIGNMENT.LEFT}
          linkAs={SmartLink}
          isWrapped={true}
          emptyMessage="No posts tagged TypeScript yet."
        />
        <Pagination
          currentPage={1}
          totalPages={3}
          createHref={(page) =>
            page === 1 ? '/tags/typescript' : `/tags/typescript/page/${page}`
          }
          ariaLabel="TypeScript pages"
          previousLabel="Previous"
          nextLabel="Next"
          linkAs={SmartLink}
        />
      </Section>
    ),
    ...overrides,
  };
};
