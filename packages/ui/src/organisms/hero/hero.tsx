import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  type IWithClassName,
  type IWithDataTestId,
  type TContentAlignment,
  type TFullBrandVariant,
  type THeroVariant,
  type TMediaOrder,
} from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import {
  cloneElement,
  Fragment,
  type ElementType,
  type ReactElement,
} from 'react';

import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia, type THeroMediaProps } from './components/media/hero-media';
import { heroVariants } from './hero-variants';

const HeroParts = {
  Media: HeroMedia,
  Cta: HeroCta,
} satisfies Record<string, ElementType>;

export type THeroProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    titleId: string;
    eyebrow?: string;
    excerpt?: string;
    /** The hero's layout shape — the same three shapes `CtaModule` uses. */
    variant?: THeroVariant;
    /** Where the copy column sits relative to the media. Split uses LEFT/RIGHT; Banner uses all three; Stacked has no split axis, so it has no effect there. */
    contentPosition?: TContentAlignment;
    /** How text aligns within the copy column, on every variant. */
    contentAlignment?: TContentAlignment;
    /** Split applies this below the two-column breakpoint; Stacked at every width; Banner ignores it — its image is the background. */
    mediaOrder?: TMediaOrder;
    /** Picks Banner's scrim and on-image copy color. Split and Stacked ignore it — their band color stays `Section`'s. */
    tone?: TFullBrandVariant;
    children?: TCompoundChildren<typeof HeroParts>;
  };

/**
 * Hero — the page-top hero band shared by every hero kind: renders `title` as
 * an `<h1>` with optional `eyebrow`/`excerpt`, plus `Hero.Cta` and `Hero.Media`
 * slots. DOM order is always copy before media — `contentPosition` and
 * `mediaOrder` only move things visually, via CSS.
 */
const HeroRoot = ({
  title,
  titleId,
  eyebrow,
  excerpt,
  variant,
  contentPosition,
  contentAlignment,
  mediaOrder,
  tone,
  children,
  className,
  dataTestId,
}: THeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const hasMedia = Boolean(slots.Media);
  const resolvedVariant = variant ?? HERO_VARIANT.SPLIT;
  const isSplit = resolvedVariant === HERO_VARIANT.SPLIT;
  const isBanner = resolvedVariant === HERO_VARIANT.BANNER;

  const resolvedPosition = contentPosition ?? CONTENT_ALIGNMENT.LEFT;
  const resolvedAlignment = isSplit
    ? contentAlignment
    : (contentAlignment ??
      (isBanner ? CONTENT_ALIGNMENT.LEFT : CONTENT_ALIGNMENT.CENTER));
  const resolvedMediaOrder = isBanner
    ? undefined
    : (mediaOrder ?? MEDIA_ORDER.LAST);

  const s = heroVariants({
    variant: resolvedVariant,
    hasMedia,
    position: resolvedPosition,
    alignment: resolvedAlignment,
    mediaOrder: resolvedMediaOrder,
    tone,
  });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.grid()}>
        <div className={s.copy()} data-testid="hero-copy">
          {eyebrow && <Eyebrow className={s.eyebrow()}>{eyebrow}</Eyebrow>}
          <div className={s.title()}>
            <Heading
              id={titleId}
              level={1}
              visual="hero"
              className={s.heading()}
            >
              {title}
            </Heading>
          </div>
          {excerpt && (
            <Text variant="hero" className={s.excerpt()}>
              {excerpt}
            </Text>
          )}
          {slots.Cta}
        </div>
        {slots.Media && (
          <div className={s.media()} data-testid="hero-media">
            {isBanner
              ? cloneElement(slots.Media as ReactElement<THeroMediaProps>, {
                  isFramed: false,
                })
              : slots.Media}
          </div>
        )}
        {isBanner && (
          <div
            className={s.overlay()}
            aria-hidden="true"
            data-testid="hero-overlay"
          />
        )}
      </div>

      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
