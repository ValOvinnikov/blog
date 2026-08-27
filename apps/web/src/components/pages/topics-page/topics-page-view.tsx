import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import type { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import type { ReactNode } from 'react';

export interface ITopicsPageViewProps {
  heading: string;
  supportingText?: string;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  taxonomyListContent: ReactNode;
}

/**
 * Pure view for `TopicsPage` — the `Home › Topics` breadcrumb trail (plus its
 * `BreadcrumbList` JSON-LD) as a sibling before `<main>`, then the archive
 * shell itself via `BlogPageTemplate`. `taxonomyListContent` is pre-rendered
 * by the wrapper (`TaxonomyListModule`) since it's an async Server Component
 * fetching its own data.
 */
export const TopicsPageView = ({
  heading,
  supportingText,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  taxonomyListContent,
}: ITopicsPageViewProps) => {
  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={breadcrumbTrail}
          ariaLabel={breadcrumbAriaLabel}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <BlogPageTemplate
        heading={heading}
        supportingText={supportingText}
        modules={taxonomyListContent}
      />
    </>
  );
};
