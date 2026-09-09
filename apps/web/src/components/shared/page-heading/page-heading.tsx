import type { TContentAlignment, THeadingBlock } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';

import { pageHeadingVariants } from './page-heading-variants';

export interface IPageHeadingProps {
  headingBlock: THeadingBlock;
  align?: TContentAlignment;
  /**
   * Whether the heading (or its supporting text, if given) keeps its own
   * trailing margin. Set `false` when nothing else renders between this
   * heading and the content that follows it, so that content's own spacing
   * is the only gap.
   */
  hasTrailingSpace?: boolean;
}

/**
 * PageHeading — a CMS document's single top-level heading (`h1`) and its
 * optional supporting paragraph, at page scale. The counterpart to
 * `ModuleHeading`, which names a page-builder module's own `Section`
 * instead of the document itself.
 */
export const PageHeading = ({
  headingBlock,
  align,
  hasTrailingSpace = true,
}: IPageHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const s = pageHeadingVariants({
    align,
    hasTrailingSpace,
    hasSupportingText: Boolean(supportingText),
  });

  return (
    <div className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {heading}
      </Heading>
      {supportingText ? (
        <p className={s.supportingText()}>{supportingText}</p>
      ) : null}
    </div>
  );
};
