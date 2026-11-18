import {
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
  type THeroVariant,
  type TMediaOrder,
  type TSpacingScale,
} from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { HERO_TEST_ID } from '@shinefold/ui/constants/hero';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@shinefold/ui/lib/react';
import { cloneElement, Fragment } from 'react';

import { HeroParts } from './hero-parts';
import { resolveHeroStyles } from './hero-styles';

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
  const {
    variant: resolvedVariant,
    isBanner,
    alignment: resolvedAlignment,
    styles: s,
    banner,
  } = resolveHeroStyles({
    variant,
    hasMedia,
    contentPosition,
    contentAlignment,
    mediaOrder,
    spacingTop,
    spacingBottom,
  });

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
            data-testid={HERO_TEST_ID.MEDIA}
          >
            {cloneElement(
              slots.Media,
              isBanner
                ? { isFramed: false }
                : {
                    variant: resolvedVariant,
                    contentAlignment: resolvedAlignment,
                  },
            )}
          </div>
        )}
        {banner && hasMedia && (
          <div
            className={banner.overlay()}
            aria-hidden="true"
            data-testid={HERO_TEST_ID.OVERLAY}
          />
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
