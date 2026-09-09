import type { TContentAlignment } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';

import { pageHeadingVariants } from './page-heading-variants';

export interface IPageHeadingProps {
  heading: string;
  supportingText?: string;
  align?: TContentAlignment;
  visual?: 'section';
}

/**
 * PageHeading — a CMS document's single top-level heading (`h1`) and its
 * optional supporting paragraph, at page scale. The counterpart to
 * `ModuleHeading`, which names a page-builder module's own `Section`
 * instead of the document itself.
 */
export const PageHeading = ({
  heading,
  supportingText,
  align,
  visual,
}: IPageHeadingProps) => {
  const s = pageHeadingVariants({ align });

  return (
    <div className={s.root()}>
      {visual === 'section' ? (
        <Heading level={1} visual="section" className={s.heading()}>
          {heading}
        </Heading>
      ) : (
        <h1 className={s.heading()}>{heading}</h1>
      )}
      {supportingText ? (
        <p className={s.supportingText()}>{supportingText}</p>
      ) : null}
    </div>
  );
};
