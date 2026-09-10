import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType, type ReactNode } from 'react';

import { pageShellVariants } from './page-shell-variants';

const PageShellBreadcrumbs = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);
const PageShellHeading = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);
const PageShellContent = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);

const PageShellParts = {
  Breadcrumbs: PageShellBreadcrumbs,
  Heading: PageShellHeading,
  Content: PageShellContent,
} satisfies Record<string, ElementType>;

type TPageShellProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<typeof PageShellParts>;
  };

/**
 * PageShell — the structural skeleton every CMS page but the post renders
 * through: an optional `Breadcrumbs` trail before `<main>`, then an optional
 * `Heading` and `Content` region inside it. Owns only the landmark and the
 * region order — never a heading fallback, a container width, the spacing
 * between regions, or any knowledge of what a region contains.
 */
const PageShellRoot = ({
  children,
  className,
  dataTestId,
}: TPageShellProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PageShellParts);

  return (
    <>
      {slots.Breadcrumbs}
      <main
        className={pageShellVariants({ class: className })}
        data-testid={dataTestId}
      >
        {slots.Heading}
        {slots.Content}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </main>
    </>
  );
};

export const PageShell: TCompoundComponent<
  typeof PageShellRoot,
  typeof PageShellParts
> = Object.assign(PageShellRoot, PageShellParts);
