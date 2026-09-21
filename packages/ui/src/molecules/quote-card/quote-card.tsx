import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
import { resolveComponent } from '@blog/ui/lib/react';

import {
  quoteCardVariants,
  type TQuoteCardVariants,
} from './quote-card-variants';

export type TQuoteCardProps = IWithClassName &
  IWithDataTestId & {
    quote: string;
    name: string;
    role?: string;
    avatarSrc?: string;
    avatarAlt?: string;
    hasAvatar?: boolean;
    align?: TQuoteCardVariants['align'];
    isSpotlight?: boolean;
    tone: TBrandVariant;
    href?: string;
    linkAs?: TAnchorElementType;
  };

/** A testimonial quote rendered as a figure, with the person's photo or initials and an optional link on their name. */
export const QuoteCard = ({
  quote,
  name,
  role,
  avatarSrc,
  avatarAlt,
  hasAvatar = true,
  align,
  isSpotlight = false,
  tone,
  href,
  linkAs,
  className,
  dataTestId,
}: TQuoteCardProps) => {
  const LinkComponent = resolveComponent(linkAs, 'a');
  const s = quoteCardVariants({
    align: isSpotlight ? 'center' : align,
    isSpotlight,
    tone,
  });

  return (
    <figure className={s.root({ class: className })} data-testid={dataTestId}>
      <Icon name={ICONS.QUOTE} size={SIZE.LG} className={s.quoteMark()} />
      <blockquote className={s.quote()}>{quote}</blockquote>
      <figcaption className={s.caption()}>
        {hasAvatar && (
          <Avatar
            src={avatarSrc}
            alt={avatarAlt ?? name}
            name={name}
            size={isSpotlight ? SIZE.LG : SIZE.MD}
          />
        )}
        <div className={s.person()}>
          {href ? (
            // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/fallback verbatim, so the reference stays stable across renders
            <LinkComponent href={href} className={s.name()}>
              {name}
            </LinkComponent>
          ) : (
            <span className={s.name()}>{name}</span>
          )}
          {role && <span className={s.role()}>{role}</span>}
        </div>
      </figcaption>
    </figure>
  );
};
