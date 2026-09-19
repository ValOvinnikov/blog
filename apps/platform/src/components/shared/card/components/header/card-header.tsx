import {
  Heading,
  type THeadingLevel,
} from '@platform/components/shared/heading';
import type { ReactNode } from 'react';

import { cardVariants } from '../../card-variants';

export type TCardHeaderProps = {
  title: ReactNode;
  supportingText?: ReactNode;
  actions?: ReactNode;
  headingLevel?: THeadingLevel;
  className?: string;
};

export const CardHeader = ({
  title,
  supportingText,
  actions,
  headingLevel = 3,
  className,
}: TCardHeaderProps) => {
  const { header, headerTitleGroup, headerDescription, headerActions } =
    cardVariants();

  return (
    <div className={header({ class: className })}>
      <div className={headerTitleGroup()}>
        <Heading level={headingLevel} size="cardTitle">
          {title}
        </Heading>
        {supportingText && (
          <span className={headerDescription()}>{supportingText}</span>
        )}
      </div>
      {actions && <div className={headerActions()}>{actions}</div>}
    </div>
  );
};
