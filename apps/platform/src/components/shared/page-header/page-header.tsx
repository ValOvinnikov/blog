import type { IWithClassName } from '@blog/config';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import type { ReactNode, Ref } from 'react';

import { pageHeaderVariants } from './page-header-variants';

export type TPageHeaderProps = IWithClassName & {
  title: ReactNode;
  titleRef?: Ref<HTMLHeadingElement>;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  isTitleHiddenBelowLg?: boolean;
  isActionsFullWidthBelowMd?: boolean;
};

export const PageHeader = ({
  title,
  titleRef,
  description,
  badges,
  actions,
  isTitleHiddenBelowLg = false,
  isActionsFullWidthBelowMd = false,
  className,
}: TPageHeaderProps) => {
  const {
    root,
    titleGroup,
    titleRow,
    description: descriptionSlot,
    actions: actionsSlot,
  } = pageHeaderVariants({
    isTitleHiddenBelowLg,
    isActionsFullWidthBelowMd,
    hasActions: Boolean(actions),
  });

  return (
    <div className={root({ class: className })}>
      <div className={titleGroup()}>
        <div className={titleRow()} data-testid="page-header-title-row">
          <Heading
            ref={titleRef}
            tabIndex={titleRef ? -1 : undefined}
            level={1}
            size="pageTitle"
          >
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
