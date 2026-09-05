import { BRAND_VARIANT } from '@blog/config';
import type { ITagsPageViewProps } from '@web/components/pages/tags-page';
import { TaxonomyListModuleView } from '@web/modules/taxonomy-list/taxonomy-list-module-view';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Tags', href: '/tags' },
];

export const makeTagsPageView = (
  overrides: Partial<ITagsPageViewProps> = {},
): ITagsPageViewProps => {
  return {
    heading: 'Tags',
    supportingText: 'Browse every post by tag.',
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(
      DEFAULT_TRAIL,
      'https://example.com',
    ),
    taxonomyListContent: (
      <TaxonomyListModuleView
        brandVariant={BRAND_VARIANT.PRIMARY}
        sectionHeader={{
          heading: undefined,
          supportingText: undefined,
        }}
        items={[
          {
            id: 'tag-1',
            title: 'TypeScript',
            description: 'Posts about TypeScript.',
            postCountLabel: '5 posts',
            href: '/tags/typescript',
          },
          {
            id: 'tag-2',
            title: 'React',
            description: 'Posts about React.',
            postCountLabel: '1 post',
            href: '/tags/react',
          },
        ]}
        layout={undefined}
        contentAlignment={undefined}
        titleId="tag-list-title"
        dataTestId="taxonomy-list-module-tag-list-1"
        headingLevel={2}
        accessibleTitle="Tags"
        emptyMessage="No tags yet."
      />
    ),
    ...overrides,
  };
};
