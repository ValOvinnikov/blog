import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { type ButtonHTMLAttributes } from 'react';

import { bookmarkToggleVariants } from './bookmark-toggle-variants';

export interface IBookmarkToggleProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'className'>,
    IWithDataTestId {
  isBookmarked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * BookmarkToggle — a pure, controlled icon-only toggle for saving a post to
 * read later. The consumer owns the bookmarked state and its persistence;
 * this component only reflects it (`aria-pressed`) and reports the reader's
 * intent (`onToggle`). The outline glyph fills solid when bookmarked, no
 * separate icon asset is swapped.
 */
export const BookmarkToggle = ({
  isBookmarked,
  onToggle,
  ariaLabel,
  disabled,
  className,
  dataTestId,
  ...rest
}: IBookmarkToggleProps) => {
  const { root, icon } = bookmarkToggleVariants({ isBookmarked });

  return (
    <button
      {...rest}
      type="button"
      aria-pressed={isBookmarked}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <Icon name={ICONS.BOOKMARK} size={Size.MD} className={icon()} />
    </button>
  );
};
