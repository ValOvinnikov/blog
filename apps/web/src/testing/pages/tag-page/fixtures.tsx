import { BRAND_VARIANT } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { Pagination } from '@blog/ui/organisms/pagination';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import type { ITagPageViewProps } from '@web/components/pages/tag-page';
import { PostCardItem } from '@web/components/shared/post-card-item';
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
        <Heading level={2} id="tag-posts-title">
          Posts tagged TypeScript
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
