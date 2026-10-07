import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
  type THeroVariant,
  type TMediaOrder,
  type TSpacingScale,
} from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { bannerVariants } from '@blog/ui/lib/styling';
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
    tone: TBrandVariant;
    spacingTop?: TSpacingScale;
    spacingBottom?: TSpacingScale;
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
  spacingTop,
  spacingBottom,
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
    : (contentAlignment ?? CONTENT_ALIGNMENT.LEFT);
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
  const banner = isBanner
    ? bannerVariants({
        tone,
        position: resolvedPosition,
        spacingTop,
        spacingBottom,
      })
    : undefined;

  return (
    <div
      className={s.root({ class: [banner?.root(), className] })}
      data-testid={dataTestId}
    >
      <div className={s.grid()}>
        <div
          className={s.copy({ class: banner?.copy() })}
          data-testid="hero-copy"
        >
          {slots.Avatar &&
            cloneElement(slots.Avatar, {
              contentAlignment: resolvedAlignment,
            })}
          {eyebrow && (
            <Eyebrow className={s.eyebrow({ class: banner?.title() })}>
              {eyebrow}
            </Eyebrow>
          )}
          <div className={s.group({ class: banner?.block() })}>
            <div className={s.title()}>
              <Heading
                id={titleId}
                level={1}
                visual="hero"
                className={s.heading({ class: banner?.title() })}
              >
                {title}
              </Heading>
            </div>
            {excerpt && (
              <Text
                variant="hero"
                className={s.excerpt({ class: banner?.text() })}
              >
                {excerpt}
              </Text>
            )}
            {slots.Body &&
              cloneElement(slots.Body, {
                contentAlignment: resolvedAlignment,
                className: s.body({
                  class: [banner?.copy(), banner?.text()],
                }),
              })}
          </div>
          {slots.Cta &&
            cloneElement(slots.Cta, {
              contentAlignment: resolvedAlignment,
              ...(banner && { className: banner.actions() }),
            })}
          {slots.Social &&
            cloneElement(slots.Social, {
              contentAlignment: resolvedAlignment,
              ...(banner && { className: banner.actions() }),
            })}
        </div>
        {slots.Media && (
          <div
            className={s.media({ class: banner?.media() })}
            data-testid="hero-media"
          >
            {cloneElement(
              slots.Media,
              isBanner ? { isFramed: false } : { variant: resolvedVariant },
            )}
          </div>
        )}
        {banner && (
          <div
            className={banner.overlay()}
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
