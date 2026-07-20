import type { IWithDataTestId } from '@blog/config';
import { Size } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Button } from '@blog/ui/atoms/button';
import type { IShareLinkItem } from '@blog/ui/molecules/share-link';
import { ShareLink } from '@blog/ui/molecules/share-link';
import { Link2 } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { shareButtonsVariants } from './share-buttons-variants';

export interface IShareButtonsProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  /** Pre-built share links (href, label, icon) — `@blog/ui` never constructs a share URL itself; `apps/web` builds each `href` and passes the finished list in. */
  links: IShareLinkItem[];
  onCopy?: () => void;
  /** Component each share link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
  /** Visible label for the copy-link button. Defaults to `"Copy link"`. */
  copyLabel?: string;
}

/**
 * ShareButtons molecule — renders a list of pre-built share links (each via
 * `ShareLink`) plus a copy-link action. `@blog/ui` only renders whatever
 * `links` it's given — building the platform-specific share URLs (X,
 * LinkedIn, ...) is `apps/web`'s job. `@blog/ui` never touches
 * `window`/clipboard directly either — copying is delegated entirely to the
 * `onCopy` callback, which `apps/web` wires to the actual
 * `navigator.clipboard` call at its own client boundary.
 */
export const ShareButtons = ({
  links,
  onCopy,
  className,
  dataTestId,
  linkAs,
  copyLabel = 'Copy link',
  ...rest
}: IShareButtonsProps) => {
  const { root, item } = shareButtonsVariants();

  return (
    <div
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {links.map((link) => (
        <ShareLink
          key={link.href}
          {...link}
          as={linkAs}
          className={item()}
        />
      ))}
      <Button
        variant="ghost"
        size={Size.SM}
        className={item()}
        onClick={onCopy}
      >
        <Link2 size={16} strokeWidth={1.6} aria-hidden="true" />
        {copyLabel}
      </Button>
    </div>
  );
};
