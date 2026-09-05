import { BRAND_VARIANT } from '@blog/config';
import type { ITopicsPageViewProps } from '@web/components/pages/topics-page';
import { TaxonomyListModuleView } from '@web/modules/taxonomy-list/taxonomy-list-module-view';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Topics', href: '/topics' },
];

export const makeTopicsPageView = (
  overrides: Partial<ITopicsPageViewProps> = {},
): ITopicsPageViewProps => {
  return {
    heading: 'Topics',
    supportingText: 'Browse every post by topic.',
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
            id: 'topic-1',
            title: 'Engineering',
            description: 'Posts about engineering.',
            postCountLabel: '5 posts',
            href: '/topics/engineering',
          },
          {
            id: 'topic-2',
            title: 'Design',
            description: 'Posts about design.',
            postCountLabel: '1 post',
            href: '/topics/design',
          },
        ]}
        layout={undefined}
        contentAlignment={undefined}
        titleId="topic-list-title"
        dataTestId="taxonomy-list-module-topic-list-1"
        headingLevel={2}
        accessibleTitle="Topics"
        emptyMessage="No topics yet."
      />
    ),
    ...overrides,
  };
};
