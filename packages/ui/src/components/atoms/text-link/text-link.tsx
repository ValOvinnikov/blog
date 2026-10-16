import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { ReactNode } from 'react';

import { type TTextLinkVariants, textLinkVariants } from './text-link-variants';

type TTextLinkName =
  | { children: ReactNode; ariaLabel?: string }
  | { children?: never; ariaLabel: string };

export type TTextLinkProps = IWithClassName &
  IWithDataTestId & {
    href?: string;
    as?: TAnchorElementType;
    target?: '_blank';
    title?: string;
    lang?: string;
    hrefLang?: string;
    appearance?: TTextLinkVariants['appearance'];
    variant?: TTextLinkVariants['variant'];
    currentStyle?: TTextLinkVariants['currentStyle'];
    isCurrent?: boolean;
    isStretched?: boolean;
  } & TTextLinkName;

/** A run of text that links somewhere, in the look its context calls for, and reads as plain text when there is nowhere to go. */
export const TextLink = ({
  href,
  as: LinkComponent = A_AS_CONST,
  target,
  title,
  lang,
  hrefLang,
  appearance = 'prose',
  variant = 'plain',
  currentStyle = 'underline',
  isCurrent = false,
  isStretched = false,
  ariaLabel,
  children,
  className,
  dataTestId,
}: TTextLinkProps) => {
  const { root, label } = textLinkVariants({
    appearance,
    variant,
    currentStyle,
    hasHref: Boolean(href),
    isCurrent,
    isStretched,
  });
  const ariaCurrent = isCurrent ? 'page' : undefined;

  if (!href) {
    return (
      <span
        className={root({ class: className })}
        aria-current={ariaCurrent}
        title={title}
        lang={lang}
        data-testid={dataTestId}
      >
        {ariaLabel ? (
          <>
            <span aria-hidden="true">{children}</span>
            <span className={label()}>{ariaLabel}</span>
          </>
        ) : (
          children
        )}
      </span>
    );
  }

  return (
    <LinkComponent
      href={href}
      target={target}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      title={title}
      lang={lang}
      hrefLang={hrefLang}
      className={root({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </LinkComponent>
  );
};
