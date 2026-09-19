import type { TContentAlignment, THeadingBlock } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';

import { moduleHeadingVariants } from './module-heading-variants';

export interface IModuleHeadingProps {
  headingBlock: THeadingBlock;
  id: string;
  level: THeadingLevel;
  align?: TContentAlignment;
}

export const ModuleHeading = ({
  headingBlock,
  id,
  level,
  align,
}: IModuleHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const s = moduleHeadingVariants({ align });

  return (
    <>
      <Heading level={level} id={id} className={s.label()}>
        {heading}
      </Heading>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
    </>
  );
};
