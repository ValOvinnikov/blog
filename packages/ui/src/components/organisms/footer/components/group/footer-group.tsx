import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { FooterGroupItem } from '@blog/ui/components/organisms/footer/components/group-item/footer-group-item';
import {
  hasSlotContent,
  headingTags,
  type TCompoundChildren,
  type THeadingLevel,
} from '@blog/ui/lib/react';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { Children } from 'react';

import { footerGroupVariants } from './footer-group-variants';

export type TFooterGroupProps = IWithClassName &
  IWithDataTestId & {
    heading: string;
    headingLevel: THeadingLevel;
    children?: TCompoundChildren<{ Item: typeof FooterGroupItem }>;
  };

/** One named group of footer links under the heading the editor gave it. */
export const FooterGroup = ({
  heading,
  headingLevel,
  className,
  dataTestId,
  children,
}: TFooterGroupProps) => {
  const items = Children.toArray(children).filter(hasSlotContent);
  if (!hasArrayGotItems(items)) {
    return null;
  }
  const HeadingTag = headingTags[headingLevel];
  const { root, heading: headingClass, list } = footerGroupVariants();
  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      <HeadingTag className={headingClass()}>{heading}</HeadingTag>
      <ul className={list()}>{items}</ul>
    </div>
  );
};
