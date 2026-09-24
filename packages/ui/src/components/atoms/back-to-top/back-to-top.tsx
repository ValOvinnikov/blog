import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';

import { backToTopVariants } from './back-to-top-variants';

export type TBackToTopProps = IWithClassName &
  IWithDataTestId & {
    isVisible: boolean;
    onClick: () => void;
    ariaLabel: string;
  };

/** A floating icon button that jumps the page back to its top. */
export const BackToTop = ({
  isVisible,
  onClick,
  ariaLabel,
  className,
  dataTestId,
}: TBackToTopProps) => (
  <IconButton
    ariaLabel={ariaLabel}
    title={ariaLabel}
    onClick={onClick}
    isInert={!isVisible}
    dataTestId={dataTestId}
    className={backToTopVariants({ visible: isVisible, class: className })}
  >
    <Icon name={ICONS.ARROW_UP} size={SIZE.MD} />
  </IconButton>
);
