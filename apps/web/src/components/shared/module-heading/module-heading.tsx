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
}

export const ModuleHeading = ({
  headingBlock,
  id,
  level,
  align,
}: IModuleHeadingProps) => {
  const { heading, headingPieces, supportingText } = headingBlock;
  const s = moduleHeadingVariants({ align });
  const headingContent = headingPieces
    ? { pieces: headingPieces }
    : { children: heading };

  return (
    <div className={s.wrapper()}>
      <Heading
        level={level}
        id={id}
        visual={TEXT_ROLE.SECTION_TITLE}
        className={s.heading()}
        {...headingContent}
      />
      {supportingText && (
        <Text textRole={TEXT_ROLE.INTRO} className={s.supportingText()}>
          {supportingText}
        </Text>
      )}
    </div>
  );
};
