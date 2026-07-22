'use client';

import type { IShareLinkItem } from '@blog/ui';
import { PopoverMenu } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';
import { Check, Copy, Share2 } from 'lucide-react';
import { useId } from 'react';

import { useCopyToClipboard } from './use-copy-to-clipboard';
import { usePopover } from './use-popover';

export type TPostShareProps = {
  url: string;
  title: string;
  links: IShareLinkItem[];
  className?: string;
};

/**
 * PostShare — the self-contained interactive share widget, passed into
 * `PostMeta`'s `share` slot (it never wraps `PostMeta` — see
 * `web-component-practices` Rule 1). Composes `@blog/ui`'s `PopoverMenu`
 * directly: a trigger, a "Copy link" item with a Copied state, and one item
 * per platform share link. Open/close/focus behaviour lives in `usePopover`;
 * clipboard state lives in `useCopyToClipboard` — this component only wires
 * refs and reads their results.
 *
 * @example
 * <PostMeta author={post.author} share={<PostShare url={url} title={post.title} links={shareLinks} />} />
 */
export function PostShare({ url, title, links, className }: TPostShareProps) {
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <PopoverMenu className={className}>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={`Share "${title}"`}
        open={open}
        panelId={panelId}
        onClick={toggle}
      >
        <Share2 size={16} strokeWidth={1.6} aria-hidden="true" />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        open={open}
        ariaLabel="Share options"
      >
        <PopoverMenu.Item
          icon={
            isCopied ? (
              <Check size={16} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Copy size={16} strokeWidth={1.6} aria-hidden="true" />
            )
          }
          onClick={() => copy(url)}
        >
          {isCopied ? 'Copied' : 'Copy link'}
        </PopoverMenu.Item>
        <PopoverMenu.Separator />
        {links.map((link) => (
          <PopoverMenu.Item
            key={link.href}
            as={SmartLink}
            href={link.href}
            target="_blank"
            icon={link.icon}
          >
            {link.label}
          </PopoverMenu.Item>
        ))}
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
}
