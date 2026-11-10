import { cardVariants } from '@platform/components/shared/card/card-variants';
import {
  Heading,
  type THeadingLevel,
} from '@platform/components/shared/heading';
import type { ReactNode, Ref } from 'react';

export type TCardHeaderProps = {
  title: ReactNode;
  supportingText?: ReactNode;
  actions?: ReactNode;
  headingLevel?: THeadingLevel;
  titleRef?: Ref<HTMLHeadingElement>;
  titleTabIndex?: number;
  titleId?: string;
  isDanger?: boolean;
  className?: string;
};

export const CardHeader = ({
  title,
  supportingText,
  actions,
  headingLevel = 2,
  titleRef,
  titleTabIndex,
  titleId,
  isDanger = false,
  className,
}: TCardHeaderProps) => {
  const {
    header,
    headerTitleGroup,
    headerTitle,
    headerDescription,
    headerActions,
  } = cardVariants({ isDanger });

  return (
    <div className={header({ class: className })}>
      <div className={headerTitleGroup()}>
        <Heading
          id={titleId}
          level={headingLevel}
          size="cardTitle"
          ref={titleRef}
          tabIndex={titleTabIndex}
          className={headerTitle()}
        >
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
