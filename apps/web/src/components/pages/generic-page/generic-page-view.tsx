import { Heading } from '@blog/ui/atoms/heading';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import type { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import type { ReactNode } from 'react';

import { genericPageVariants } from './generic-page-variants';

export interface IGenericPageViewProps {
  title: string;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  modulesContent: ReactNode;
}

const s = genericPageVariants();

/**
 * Pure view for `GenericPage` — the `Home › {title}` breadcrumb trail (plus
 * its `BreadcrumbList` JSON-LD) as a sibling before `<main>`, then the page's
 * own `title` as the page's `<h1>` — `page_generic` documents allow only
 * `module_content`/`module_cta` modules, neither of which renders a heading
 * of its own, so this page-level `<h1>` is the only heading guaranteed to
 * exist. `modulesContent` is pre-rendered by the wrapper (`ModuleRenderer`)
 * since it's an async Server Component. Each module owns its own full-bleed
 * background/width via `Section`, so `<main>` here is otherwise an
 * unconstrained root. `Header`/`Footer` stay owned by `[tenant]/[locale]/layout.tsx`.
 */
export const GenericPageView = ({
  title,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  modulesContent,
}: IGenericPageViewProps) => {
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

      <main className={s.root()}>
        <Heading level={1} visual="section" className={s.heading()}>
          {title}
        </Heading>
        {modulesContent}
      </main>
    </>
  );
};
