'use client';

import type {
  IPostMetaProps,
  IShareButtonsProps,
  IShareLinkItem,
} from '@blog/ui';
import { PostMeta } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';
import { useEffect, useRef, useState } from 'react';

const COPY_RESET_DELAY_MS = 2000;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type TPostShareButtonsProps = Omit<IPostMetaProps, 'className'> & {
  className?: string;
  links: IShareLinkItem[];
  url: string;
  triggerAriaLabel: string;
  panelAriaLabel?: string;
  id?: string;
};

/**
 * PostShareButtons — client-boundary wrapper around `@blog/ui`'s `PostMeta`:
 * `@blog/ui` never touches `window`/clipboard/focus itself, so this is where
 * the open/copied state, the actual `navigator.clipboard.writeText` call,
 * and the popover's dismissal (Escape, click-outside) and focus-trap
 * behaviour live, at the smallest leaf that needs them. `links` (platform
 * share URLs + icons) are built server-side and passed straight through, and
 * everything is wired into `PostMeta`'s `share` prop.
 */
export function PostShareButtons({
  author,
  publishedAt,
  formattedDate,
  readingTimeMinutes,
  className,
  dataTestId,
  links,
  url,
  triggerAriaLabel,
  panelAriaLabel,
  id = 'share-menu',
}: TPostShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCopied) return;

    const timeout = setTimeout(() => setIsCopied(false), COPY_RESET_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [isCopied]);

  useEffect(() => {
    if (!open) return;

    const panel = document.getElementById(id);
    const firstFocusable =
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();
  }, [open, id]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const panel = document.getElementById(id);
      const target = event.target as Node;

      if (panel?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
      triggerRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = document.getElementById(id);
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, id]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (!next) {
      triggerRef.current?.focus();
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => setIsCopied(true))
      .catch((error: unknown) => console.error('Failed to copy link:', error));
  };

  const share: IShareButtonsProps = {
    links,
    open,
    onOpenChange: handleOpenChange,
    triggerRef,
    triggerAriaLabel,
    panelAriaLabel,
    isCopied,
    onCopyClick: handleCopyClick,
    id,
    linkAs: SmartLink,
  };

  return (
    <PostMeta
      className={className}
      dataTestId={dataTestId}
      author={author}
      publishedAt={publishedAt}
      formattedDate={formattedDate}
      readingTimeMinutes={readingTimeMinutes}
      share={share}
    />
  );
}
