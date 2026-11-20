'use client';

import { ICONS, SIZE } from '@shinefold/config';
import { bookmarkToggleVariants } from '@shinefold/ui/components/atoms/bookmark-toggle/bookmark-toggle-variants';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { usePostSummary } from '@web/context/post-summary-provider';

import { postSummaryButtonVariants } from './post-summary-button-variants';

export interface IPostSummaryButtonProps {
  label: string;
}

export const PostSummaryButton = ({ label }: IPostSummaryButtonProps) => {
  const { isOpen, cardId, toggle } = usePostSummary();
  const { root } = bookmarkToggleVariants({ isBookmarked: isOpen });
  const { chevron } = postSummaryButtonVariants({ isOpen });

  // `Button` takes no aria-expanded or aria-controls, so the disclosure is a raw button in Save's look.
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={cardId}
      onClick={toggle}
      className={root()}
    >
      <span>{label}</span>
      <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} className={chevron()} />
    </button>
  );
};
