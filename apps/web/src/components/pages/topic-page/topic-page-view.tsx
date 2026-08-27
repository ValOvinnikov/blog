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

export interface ITopicPageViewProps {
  heading: string;
  supportingText?: string;
  topics: TTopicsList;
  activeSlug: string;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  postsContent: ReactNode;
}

/**
 * Pure view for `TopicPage` — shared by `/topics/[slug]` and
 * `/topics/[slug]/page/[page]`: the `Home › Topic` breadcrumb trail (plus
 * its `BreadcrumbList` JSON-LD) as a sibling before `<main>`, then the
 * archive shell itself via `BlogPageTemplate`. `postsContent` is
 * pre-rendered by the wrapper (`PostListModule` + `ModuleRenderer`) since
 * both are async Server Components fetching their own data.
 */
export const TopicPageView = ({
  heading,
  supportingText,
  topics,
  activeSlug,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  postsContent,
}: ITopicPageViewProps) => {
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
        topicChips={<TopicChipList topics={topics} activeSlug={activeSlug} />}
        modules={postsContent}
      />
    </>
  );
};
