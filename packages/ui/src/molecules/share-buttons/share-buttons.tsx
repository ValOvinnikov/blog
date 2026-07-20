import type { IWithDataTestId } from '@blog/config';
import { Size } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Button } from '@blog/ui/atoms/button';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { ExternalLink, Link2 } from 'lucide-react';
import type { ElementType, HTMLAttributes } from 'react';

import { shareButtonsVariants } from './share-buttons-variants';

export interface IShareButtonsProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  url: string;
  title: string;
  onCopy?: () => void;
  /** Component each share link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
  /** Visible label for the X share link. Defaults to `"Share on X"`. */
  xLabel?: string;
  /** Visible label for the LinkedIn share link. Defaults to `"Share on LinkedIn"`. */
  linkedInLabel?: string;
  /** Visible label for the copy-link button. Defaults to `"Copy link"`. */
  copyLabel?: string;
}

const buildTwitterShareUrl = (url: string, title: string) => {
  const params = new URLSearchParams({ text: title, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
};

const buildLinkedInShareUrl = (url: string) => {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
};

/**
 * ShareButtons molecule — social share links (X, LinkedIn) built from `url`
 * and `title`, plus a copy-link action. The share links reuse `LinkButton`
 * (route-agnostic and polymorphic via `linkAs`, defaulting to a plain `<a>`,
 * or `apps/web`'s router `Link` when passed) rather than a bare `<a>`.
 * `@blog/ui` never touches `window`/clipboard directly — copying is
 * delegated entirely to the `onCopy` callback, which `apps/web` wires to the
 * actual `navigator.clipboard` call at its own client boundary.
 */
export const ShareButtons = ({
  url,
  title,
  onCopy,
  className,
  dataTestId,
  linkAs,
  xLabel = 'Share on X',
  linkedInLabel = 'Share on LinkedIn',
  copyLabel = 'Copy link',
  ...rest
}: IShareButtonsProps) => {
  const { root, item } = shareButtonsVariants();
  // Widened for LinkButton's `as` slot: the restricted `TAnchorElementType`
  // union (no `rel`) would otherwise reject the `rel` prop below.
  const linkAsElement = linkAs as ElementType | undefined;

  return (
    <div
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <LinkButton
        as={linkAsElement}
        href={buildTwitterShareUrl(url, title)}
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size={Size.SM}
        className={item()}
      >
        <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        {xLabel}
      </LinkButton>
      <LinkButton
        as={linkAsElement}
        href={buildLinkedInShareUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        size={Size.SM}
        className={item()}
      >
        <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
        {linkedInLabel}
      </LinkButton>
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
