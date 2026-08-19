import {
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
  Size,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';

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

/**
 * BookmarkToggle — a pure, controlled icon+label toggle for saving a post to
 * read later. The consumer owns the bookmarked state and its persistence;
 * this component only reflects it (`aria-pressed`, icon fill, visible
 * `label` text) and reports the reader's intent (`onToggle`). The outline
 * glyph fills solid when bookmarked, no separate icon asset is swapped.
 */
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
      <Icon name={ICONS.BOOKMARK} size={Size.MD} className={icon()} />
      <span>{label}</span>
    </button>
  );
};
