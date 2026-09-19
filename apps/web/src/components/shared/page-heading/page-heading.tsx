import type { TContentAlignment, THeadingBlock } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';

import { pageHeadingVariants } from './page-heading-variants';

export interface IPageHeadingProps {
  headingBlock: THeadingBlock;
  align?: TContentAlignment;
  hasTrailingSpace?: boolean;
}

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
