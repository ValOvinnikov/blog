import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';

import { backToTopVariants } from './back-to-top-variants';

export interface IBackToTopProps extends IWithDataTestId {
  isVisible: boolean;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}

/**
 * BackToTop — a floating icon button that jumps the page back to its top.
 * `isVisible` fully controls its appear/disappear transition; the consumer
 * (`apps/web`) owns the scroll listener and the actual `window.scrollTo`
 * call that decide when it's true.
 */
export const BackToTop = ({
  isVisible,
  onClick,
  ariaLabel,
  className,
  dataTestId,
}: IBackToTopProps) => (
  <IconButton
    ariaLabel={ariaLabel}
    title={ariaLabel}
    onClick={onClick}
    inert={!isVisible}
    dataTestId={dataTestId}
    className={backToTopVariants({ visible: isVisible, class: className })}
  >
    <Icon name={ICONS.ARROW_UP} size={Size.MD} />
  </IconButton>
);
