'use client';

import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { PopoverMenu } from '@blog/ui/molecules/popover-menu';
import { type IShareLinkItem } from '@blog/ui/molecules/share-link';
import { SmartLink } from '@web/components/shared/smart-link';
import { useCopyToClipboard } from '@web/hooks/use-copy-to-clipboard';
import { usePopover } from '@web/hooks/use-popover';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { postShareLiveRegionVariants } from './post-share-variants';

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
export const PostShare = ({
  url,
  title,
  links,
  className,
}: TPostShareProps) => {
  const t = useTranslations('postShare');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <PopoverMenu className={className}>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('shareAriaLabel', { title })}
        isOpen={open}
        panelId={panelId}
        onClick={toggle}
      >
        <Icon name={ICONS.SHARE} size={SIZE.SM} />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        isOpen={open}
        ariaLabel={t('panelAriaLabel')}
      >
        <PopoverMenu.Item
          icon={
            isCopied ? (
              <Icon name={ICONS.CHECK} size={SIZE.SM} />
            ) : (
              <Icon name={ICONS.COPY} size={SIZE.SM} />
            )
          }
          onClick={() => copy(url)}
        >
          {isCopied ? t('copied') : t('copyLink')}
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
      <span
        role="status"
        aria-live="polite"
        className={postShareLiveRegionVariants()}
      >
        {isCopied ? t('linkCopied') : ''}
      </span>
    </PopoverMenu>
  );
};
