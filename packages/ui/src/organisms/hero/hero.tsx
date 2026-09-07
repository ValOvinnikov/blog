import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  type IWithClassName,
  type IWithDataTestId,
  type TContentAlignment,
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
import { Fragment, type ElementType } from 'react';

import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia } from './components/media/hero-media';
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
    /** Where the copy column sits relative to the media. Split uses LEFT/RIGHT; Banner uses all three. */
    contentPosition?: TContentAlignment;
    /** How text aligns within the copy column, on every variant. */
    contentAlignment?: TContentAlignment;
    /** Split applies this below the two-column breakpoint; Stacked at every width; Banner ignores it — its image is the background. */
    mediaOrder?: TMediaOrder;
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
  });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.grid()}>
        <div className={s.copy()} data-testid="hero-copy">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <div className={s.title()}>
            <Heading id={titleId} level={1} visual="hero">
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
        {hasMedia && (
          <div className={s.media()} data-testid="hero-media">
            {slots.Media}
          </div>
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
