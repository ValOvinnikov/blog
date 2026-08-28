import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import type { ReactNode } from 'react';

import { pageHeaderVariants } from './page-header-variants';

export type TPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Rendered beside the title — status/plan pills, not part of the heading itself. */
  badges?: ReactNode;
  /** Right-aligned; wraps below the title row on narrow viewports. */
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  badges,
  actions,
  className,
}: TPageHeaderProps) => {
  const {
    root,
    titleGroup,
    titleRow,
    description: descriptionSlot,
    actions: actionsSlot,
  } = pageHeaderVariants();

  return (
    <div className={root({ class: className })}>
      <div className={titleGroup()}>
        <div className={titleRow()}>
          <Heading level={1} size="pageTitle">
            {title}
          </Heading>
          {badges}
        </div>
        {description && (
          <Text variant="supporting" className={descriptionSlot()}>
            {description}
          </Text>
        )}
      </div>
      {actions && <div className={actionsSlot()}>{actions}</div>}
    </div>
  );
};
