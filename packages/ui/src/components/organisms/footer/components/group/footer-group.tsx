import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { headingTags, type THeadingLevel } from '@blog/ui/lib/react';
import { Children, type ReactNode } from 'react';

import { footerGroupVariants } from './footer-group-variants';

export type TFooterGroupProps = IWithClassName &
  IWithDataTestId & {
    heading: string;
    headingLevel: THeadingLevel;
    children?: ReactNode;
  };

/** One named group of footer links under the heading the editor gave it. */
export const FooterGroup = ({
  heading,
  headingLevel,
  className,
  dataTestId,
  children,
}: TFooterGroupProps) => {
  const links = Children.toArray(children);
  if (links.length === 0) {
    return null;
  }
  const HeadingTag = headingTags[headingLevel];
  const { root, heading: headingClass, list } = footerGroupVariants();
  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      <HeadingTag className={headingClass()}>{heading}</HeadingTag>
      <ul className={list()}>
        {links.map((link, index) => (
          <li key={index}>{link}</li>
        ))}
      </ul>
    </div>
  );
};
