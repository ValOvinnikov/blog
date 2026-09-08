import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import type { MouseEventHandler } from 'react';

import { carouselControlsVariants } from './carousel-controls-variants';

export type TCarouselControlsProps = IWithClassName &
  IWithDataTestId & {
    previousLabel: string;
    nextLabel: string;
    onPrevious?: MouseEventHandler<HTMLButtonElement>;
    onNext?: MouseEventHandler<HTMLButtonElement>;
    isPreviousDisabled?: boolean;
    isNextDisabled?: boolean;
  };

/**
 * The previous/next buttons for a `Carousel`. Both always render; disabled
 * is a prop, never a reason to omit one, so hydration never shifts the
 * layout.
 */
export const CarouselControls = ({
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  isPreviousDisabled,
  isNextDisabled,
  className,
  dataTestId,
}: TCarouselControlsProps) => {
  const s = carouselControlsVariants();

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <IconButton
        ariaLabel={previousLabel}
        onClick={onPrevious}
        isDisabled={isPreviousDisabled}
      >
        <Icon
          name={ICONS.CHEVRON_RIGHT}
          size={SIZE.SM}
          className={s.previousIcon()}
        />
      </IconButton>
      <IconButton
        ariaLabel={nextLabel}
        onClick={onNext}
        isDisabled={isNextDisabled}
      >
        <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
      </IconButton>
    </div>
  );
};
