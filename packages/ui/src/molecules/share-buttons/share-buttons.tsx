import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { PopoverMenu } from '@blog/ui/molecules/popover-menu';
import type { IShareLinkItem } from '@blog/ui/molecules/share-link';
import { Check, Link2, Share2 } from 'lucide-react';
import type { ElementType, Ref } from 'react';

export interface IShareButtonsProps extends IWithDataTestId {
  /** Pre-built share links (href, label, icon) — `@blog/ui` never constructs a share URL itself; `apps/web` builds each `href` and passes the finished list in. */
  links: IShareLinkItem[];
  /** Whether the share menu panel is open — fully controlled by the caller, which also owns focus-trap/Escape/outside-click dismissal. */
  open: boolean;
  /** Called with the next open state when the trigger is clicked. */
  onOpenChange: (open: boolean) => void;
  /** Forwarded to the trigger `<button>` so the caller can manage focus (e.g. return focus here when the panel closes). */
  triggerRef?: Ref<HTMLButtonElement>;
  /** Accessible name for the trigger icon-button — no hardcoded label. */
  triggerAriaLabel: string;
  /** Accessible name for the menu panel (`aria-label`). */
  panelAriaLabel?: string;
  /** Whether the copy-link action has just succeeded — swaps the "Copy link" row into a "Copied" visual state. The caller owns the actual `navigator.clipboard` call and any reset timeout. */
  isCopied?: boolean;
  onCopyClick?: () => void;
  /** Visible label for the copy-link row. Defaults to `"Copy link"`. */
  copyLabel?: string;
  /** Visible label for the copy-link row once `isCopied` is `true`. Defaults to `"Copied"`. */
  copiedLabel?: string;
  /** `id` used to link the trigger's `aria-controls` to the panel — override when rendering more than one `ShareButtons` on the same page. */
  id?: string;
  /** Component each share link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
  className?: string;
}

/**
 * ShareButtons — an icon trigger that opens a `PopoverMenu` with `Copy link`
 * pinned at top, followed by one pill row per entry in `links` (e.g. "Share
 * on X", "Share on LinkedIn"). Purely presentational: open/closed state, the
 * copy-link side effect, and focus-trap/Escape/outside-click dismissal all
 * live in the `apps/web` client wrapper that supplies `open`/`onOpenChange`/
 * `isCopied`/`onCopyClick`.
 */
export const ShareButtons = ({
  links,
  open,
  onOpenChange,
  triggerRef,
  triggerAriaLabel,
  panelAriaLabel,
  isCopied = false,
  onCopyClick,
  copyLabel = 'Copy link',
  copiedLabel = 'Copied',
  id = 'share-menu',
  className,
  dataTestId,
  linkAs,
}: IShareButtonsProps) => {
  // Widened for PopoverMenu.Item's `as` slot: the restricted `TAnchorElementType`
  // union (no `rel`) would otherwise reject the `rel` prop below. See
  // `ShareLink`'s identical workaround (packages/ui/src/molecules/share-link/share-link.tsx).
  const asElement = (linkAs ?? 'a') as ElementType;

  return (
    <PopoverMenu className={className} dataTestId={dataTestId}>
      <PopoverMenu.Trigger
        ariaLabel={triggerAriaLabel}
        open={open}
        panelId={id}
        triggerRef={triggerRef}
        onClick={() => onOpenChange(!open)}
      >
        <Share2 size={16} strokeWidth={1.6} aria-hidden="true" />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel id={id} open={open} ariaLabel={panelAriaLabel}>
        <PopoverMenu.Item
          icon={
            isCopied ? (
              <Check size={16} strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Link2 size={16} strokeWidth={1.6} aria-hidden="true" />
            )
          }
          onClick={onCopyClick}
        >
          {isCopied ? copiedLabel : copyLabel}
        </PopoverMenu.Item>
        {links.map((link) => (
          <PopoverMenu.Item
            key={link.href}
            as={asElement}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            icon={link.icon}
          >
            {link.label}
          </PopoverMenu.Item>
        ))}
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
};
