import { Heading } from '@admin/components/shared/heading';
import type { ReactNode } from 'react';

import { cardVariants } from '../../card-variants';

export type TCardHeaderProps = {
  title: ReactNode;
  supportingText?: ReactNode;
  /** Right-aligned, e.g. a button or menu trigger. */
  actions?: ReactNode;
  className?: string;
};

export const CardHeader = ({
  title,
  supportingText,
  actions,
  className,
}: TCardHeaderProps) => {
  const { header, headerTitleGroup, headerDescription, headerActions } =
    cardVariants();

  return (
    <div className={header({ class: className })}>
      <div className={headerTitleGroup()}>
        <Heading level={3} size="cardTitle">
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
