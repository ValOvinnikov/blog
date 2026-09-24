import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';

import {
  bookmarkToggleVariants,
  type TBookmarkToggleVariants,
} from './bookmark-toggle-variants';

export type TBookmarkToggleProps = IWithClassName &
  IWithDataTestId & {
    isBookmarked: NonNullable<TBookmarkToggleVariants['isBookmarked']>;
    onToggle: () => void;
    label: string;
    ariaLabel: string;
    isDisabled?: boolean;
  };

/** A pure, controlled icon+label toggle for saving a post to read later. */
export const BookmarkToggle = ({
  isBookmarked,
  onToggle,
  label,
  ariaLabel,
  isDisabled,
  className,
  dataTestId,
}: TBookmarkToggleProps) => {
  const { root, icon } = bookmarkToggleVariants({ isBookmarked });

  return (
    <button
      type="button"
      aria-pressed={isBookmarked}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={isDisabled}
      onClick={onToggle}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <Icon name={ICONS.BOOKMARK} size={SIZE.MD} className={icon()} />
      <span>{label}</span>
    </button>
  );
};
