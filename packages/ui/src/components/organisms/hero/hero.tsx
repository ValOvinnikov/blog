import {
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
  type THeroVariant,
  type TLayout,
  type TMediaOrder,
} from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Footnote } from '@shinefold/ui/components/atoms/footnote';
import type { THeadingText } from '@shinefold/ui/components/atoms/heading';
import { HERO_TEST_ID } from '@shinefold/ui/constants/hero';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@shinefold/ui/lib/react';
import { cloneElement, Fragment, type ElementType } from 'react';

import { HeroAvatar } from './components/avatar/hero-avatar';
import { HeroBody } from './components/body/hero-body';
import { HeroCta } from './components/cta/hero-cta';
import { HeroHeadline } from './components/headline/hero-headline';
import { HeroMedia } from './components/media/hero-media';
import { HeroMediaArea } from './components/media-area/hero-media-area';
import { HeroSocial } from './components/social/hero-social';
import { resolveHeroStyles } from './hero-styles';

const HeroParts = {
  Avatar: HeroAvatar,
  Media: HeroMedia,
  Body: HeroBody,
  Cta: HeroCta,
  Footnote,
  Social: HeroSocial,
} satisfies Record<string, ElementType>;

export type THeroLayout = Pick<TLayout, 'spacingTop' | 'spacingBottom'> & {
  contentPosition?: TContentAlignment;
  contentAlignment?: TContentAlignment;
  mediaOrder?: TMediaOrder;
};

export type THeroProps = IWithClassName &
  IWithDataTestId & {
    title: THeadingText;
    titleId: string;
    eyebrow?: string;
    excerpt?: string;
    variant?: THeroVariant;
    layout?: THeroLayout;
    tone: TBrandVariant;
    children?: TCompoundChildren<typeof HeroParts>;
  };

const HeroRoot = ({
  title,
  titleId,
  eyebrow,
  excerpt,
  variant,
  layout,
  tone,
  children,
  className,
  dataTestId,
}: THeroProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeroParts);
  const heroStyles = resolveHeroStyles({
    variant,
    hasMedia: Boolean(slots.Media),
    layout,
  });
  const {
    isBanner,
    alignment: resolvedAlignment,
    styles: s,
    banner,
  } = heroStyles;

  return (
    <div
      className={s.root({ class: [banner?.root(), className] })}
      data-skin={isBanner ? tone : undefined}
      data-testid={dataTestId}
    >
      <div className={s.grid()}>
        <div
          className={s.copy({ class: banner?.copy() })}
          data-testid={HERO_TEST_ID.COPY}
        >
          {slots.Avatar &&
            cloneElement(slots.Avatar, {
              contentAlignment: resolvedAlignment,
            })}
          {eyebrow && <Eyebrow className={banner?.title()}>{eyebrow}</Eyebrow>}
          <div className={s.group({ class: banner?.block() })}>
            <HeroHeadline
              title={title}
              titleId={titleId}
              excerpt={excerpt}
              heroStyles={heroStyles}
            />
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
          {slots.Footnote &&
            cloneElement(slots.Footnote, {
              className: s.footnote({
                class: [
                  banner?.block(),
                  banner?.text(),
                  slots.Footnote.props.className,
                ],
              }),
            })}
          {slots.Social &&
            cloneElement(slots.Social, {
              contentAlignment: resolvedAlignment,
              ...(banner && { className: banner.actions() }),
            })}
        </div>
        {slots.Media && (
          <HeroMediaArea media={slots.Media} heroStyles={heroStyles} />
        )}
      </div>

      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

/** The page-top band every hero kind renders, where a page states what it is. */
export const Hero: TCompoundComponent<typeof HeroRoot, typeof HeroParts> =
  Object.assign(HeroRoot, HeroParts);
