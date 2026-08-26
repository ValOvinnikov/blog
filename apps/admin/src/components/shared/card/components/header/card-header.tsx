import { Heading } from '@admin/components/shared/heading';
import type { ReactNode } from 'react';

import { cardVariants } from '../../card-variants';

export type TCardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned, e.g. a button or menu trigger. */
  actions?: ReactNode;
  className?: string;
};

export const CardHeader = ({
  title,
  description,
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
        {description && (
          <span className={headerDescription()}>{description}</span>
        )}
      </div>
      {actions && <div className={headerActions()}>{actions}</div>}
    </div>
  );
};
