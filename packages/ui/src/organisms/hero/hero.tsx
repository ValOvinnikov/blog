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
import { cloneElement, Fragment, type ElementType } from 'react';

import { HeroAvatar } from './components/avatar/hero-avatar';
import { HeroBody } from './components/body/hero-body';
import { HeroCta } from './components/cta/hero-cta';
import { HeroMedia } from './components/media/hero-media';
import { HeroSocial } from './components/social/hero-social';
import { heroVariants } from './hero-variants';

const HeroParts = {
  Avatar: HeroAvatar,
  Media: HeroMedia,
  Body: HeroBody,
  Cta: HeroCta,
  Social: HeroSocial,
} satisfies Record<string, ElementType>;

export type THeroProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    titleId: string;
    eyebrow?: string;
    excerpt?: string;
    variant?: THeroVariant;
    contentPosition?: TContentAlignment;
    contentAlignment?: TContentAlignment;
    mediaOrder?: TMediaOrder;
    tone?: TFullBrandVariant;
    children?: TCompoundChildren<typeof HeroParts>;
  };

/** The page-top hero band shared by every hero kind: renders `title` as an `<h1>` with optional `eyebrow`/`excerpt`, plus `Hero.Avatar`, `Hero.Body`, `Hero.Cta`, `Hero.Media`, and `Hero.Social` slots. */
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
          {slots.Avatar &&
            cloneElement(slots.Avatar, {
              contentAlignment: resolvedAlignment,
            })}
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
          {slots.Body &&
            cloneElement(slots.Body, {
              contentAlignment: resolvedAlignment,
              className: s.body(),
            })}
          {slots.Cta &&
            cloneElement(slots.Cta, {
              contentAlignment: resolvedAlignment,
            })}
          {slots.Social &&
            cloneElement(slots.Social, {
              contentAlignment: resolvedAlignment,
            })}
        </div>
        {slots.Media && (
          <div className={s.media()} data-testid="hero-media">
            {isBanner
              ? cloneElement(slots.Media, { isFramed: false })
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
