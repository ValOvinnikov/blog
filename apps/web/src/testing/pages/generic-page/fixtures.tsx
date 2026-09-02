import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import type { IGenericPageViewProps } from '@web/components/pages/generic-page';
import { ContentModuleView } from '@web/modules/content/content-module-view';
import { CtaModuleView } from '@web/modules/cta/cta-module-view';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { Fragment } from 'react';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
];

export const makeGenericPageView = (
  overrides: Partial<IGenericPageViewProps> = {},
): IGenericPageViewProps => {
  return {
    title: 'About Us',
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(
      DEFAULT_TRAIL,
      'https://example.com',
    ),
    modulesContent: (
      <Fragment>
        <ContentModuleView
          id="content-1"
          brandVariant={BRAND_VARIANT.PRIMARY}
          body={richTextDemo}
          layout={undefined}
          baseUrl="https://cdn.sanity.io/images/test-project/test-dataset/"
        />
        <CtaModuleView
          id="cta-1"
          variant={CTA_VARIANT.CALLOUT}
          brandVariant={BRAND_VARIANT.SECONDARY}
          eyebrow={undefined}
          sectionHeader={{
            heading: 'Get in touch',
            supportingText: 'Have a question? We would love to hear from you.',
            align: undefined,
          }}
          content={undefined}
          image={undefined}
          imageSide={undefined}
          mobileMediaOrder={undefined}
          actions={ctaActionsDemo}
          footnote={undefined}
          layout={undefined}
        />
      </Fragment>
    ),
    ...overrides,
  };
};
