import type { TContentAlignment, THeadingBlock } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';

import { pageHeadingVariants } from './page-heading-variants';

export interface IPageHeadingProps {
  headingBlock: THeadingBlock;
  align?: TContentAlignment;
}

export const PageHeading = ({ headingBlock, align }: IPageHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const s = pageHeadingVariants({
    align,
    hasSupportingText: Boolean(supportingText),
  });

  return (
    <div className={s.root()}>
      <div className={s.inner()}>
        <div className={s.text()}>
          <Heading level={1} visual="page" className={s.heading()}>
            {heading}
          </Heading>
          {supportingText ? (
            <p className={s.supportingText()}>{supportingText}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
