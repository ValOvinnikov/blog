import type { TTopicsList } from '@blog/service';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import type { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import type { ReactNode } from 'react';

export interface IBlogListPageViewProps {
  heading: string;
  supportingText?: string;
  topics: TTopicsList;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  postsContent: ReactNode;
}

/**
 * Pure view for `BlogListPage` — the `Home › Blog` breadcrumb trail (plus its
 * `BreadcrumbList` JSON-LD) as a sibling before `<main>`, then the archive
 * shell itself. `postsContent` is pre-rendered by the wrapper (`PostListModule`
 * + `ModuleRenderer`) since both are async Server Components fetching their
 * own data.
 */
export const BlogListPageView = ({
  heading,
  supportingText,
  topics,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  postsContent,
}: IBlogListPageViewProps) => {
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
        topicChips={<TopicChipList topics={topics} />}
        modules={postsContent}
      />
    </>
  );
};
