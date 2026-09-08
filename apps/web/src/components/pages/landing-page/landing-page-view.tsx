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

import { landingPageVariants } from './landing-page-variants';

export interface ILandingPageViewProps {
  title: string;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  hero?: ReactNode;
  modulesContent: ReactNode;
}

const s = landingPageVariants();

/**
 * Pure view for `LandingPage` — the `Home › {title}` breadcrumb trail (plus
 * its `BreadcrumbList` JSON-LD) as a sibling before `<main>`. Hero replaces
 * the page's default title heading; exactly one of the two ever renders.
 * `modulesContent` is pre-rendered by the wrapper (`ModuleRenderer`) since
 * it's an async Server Component. Each module owns its own full-bleed
 * background/width via `Section`, so `<main>` here is otherwise an
 * unconstrained root. `Header`/`Footer` stay owned by
 * `[tenant]/[locale]/layout.tsx`.
 */
export const LandingPageView = ({
  title,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  hero,
  modulesContent,
}: ILandingPageViewProps) => {
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
        {hero ?? (
          <Heading level={1} visual="section" className={s.heading()}>
            {title}
          </Heading>
        )}
        {modulesContent}
      </main>
    </>
  );
};
