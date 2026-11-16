import type { TContentAlignment, THeadingBlock } from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import type { THeadingLevel } from '@shinefold/ui/lib/react';

import { moduleHeadingVariants } from './module-heading-variants';

export interface IModuleHeadingProps {
  headingBlock: THeadingBlock;
  id: string;
  level: THeadingLevel;
  align?: TContentAlignment;
  variant?: 'label' | 'section';
}

export const ModuleHeading = ({
  headingBlock,
  id,
  level,
  align,
  variant = 'label',
}: IModuleHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const s = moduleHeadingVariants({ variant, align });

  return (
    <div className={s.wrapper()}>
      <Heading
        level={level}
        id={id}
        visual={variant === 'section' ? 'section' : undefined}
        className={s.label()}
      >
        {heading}
      </Heading>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
    </div>
  );
};
