import type { TContentAlignment, THeadingBlock } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';

import { moduleHeadingVariants } from './module-heading-variants';

export interface IModuleHeadingProps {
  headingBlock: THeadingBlock;
  accessibleTitle: string;
  id: string;
  level: THeadingLevel;
  align?: TContentAlignment;
}

/**
 * ModuleHeading — the mono uppercase label that names a module's
 * surrounding `Section` via `id`, falling back to a visually hidden
 * accessible title when no heading was authored.
 */
export const ModuleHeading = ({
  headingBlock,
  accessibleTitle,
  id,
  level,
  align,
}: IModuleHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const hasHeading = Boolean(heading?.trim());
  const resolvedTitle = hasHeading ? heading : accessibleTitle;
  const s = moduleHeadingVariants({ align });

  return (
    <>
      <Heading
        level={level}
        id={id}
        className={hasHeading ? s.label() : s.labelFallback()}
      >
        {resolvedTitle}
      </Heading>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
    </>
  );
};
