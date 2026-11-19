import {
  TEXT_ROLE,
  type TContentAlignment,
  type THeadingBlock,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { THeadingLevel } from '@shinefold/ui/lib/react';

import { moduleHeadingVariants } from './module-heading-variants';

export interface IModuleHeadingProps {
  headingBlock: THeadingBlock;
  id: string;
  level: THeadingLevel;
  align?: TContentAlignment;
  variant?: 'section';
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
    <div className={s.wrapper()}>
      <Heading
        level={level}
        id={id}
        visual={TEXT_ROLE.SECTION_TITLE}
        className={s.heading()}
      >
        {heading}
      </Heading>
      {supportingText && (
        <Text textRole={TEXT_ROLE.INTRO} className={s.supportingText()}>
          {supportingText}
        </Text>
      )}
    </div>
  );
};
