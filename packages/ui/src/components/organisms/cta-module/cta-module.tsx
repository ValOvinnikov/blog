import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  MEDIA_ORDER,
  type TBrandVariant,
  type TContentAlignment,
  type TCtaVariant,
  type TMediaOrder,
  type TSpacingScale,
} from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { Heading } from '@blog/ui/components/atoms/heading';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import { Prose } from '@blog/ui/components/atoms/prose';
import { bannerVariants } from '@blog/ui/lib/styling';
import type { ReactNode } from 'react';

import {
  ctaModuleVariants,
  type TCtaModuleVariants,
} from './cta-module-variants';

export type TCtaModuleProps = IWithClassName &
  IWithDataTestId & {
    variant: TCtaVariant;
    tone: TBrandVariant;
    eyebrow?: string;
    heading: string;
    headingId?: string;
    supportingText?: string;
    content?: ReactNode;
    image?: ReactNode;
    actions?: ReactNode;
    footnote?: string;
    contentPosition?: TContentAlignment;
    contentAlignment?: TContentAlignment;
    mobileMediaOrder?: TMediaOrder;
    isWrapped?: TCtaModuleVariants['wrapped'];
    spacingTop?: TSpacingScale;
    spacingBottom?: TSpacingScale;
  };

/** Page-builder organism rendering a call-to-action in one of three layouts. */
export const CtaModule = ({
  variant,
  tone,
  eyebrow,
  heading,
  headingId,
  supportingText,
  content,
  image,
  actions,
  footnote,
  contentPosition,
  contentAlignment,
  mobileMediaOrder,
  isWrapped,
  spacingTop,
  spacingBottom,
  className,
  dataTestId,
}: TCtaModuleProps) => {
  const isSplit = variant === CTA_VARIANT.SPLIT;
  const isBanner = variant === CTA_VARIANT.BANNER;
  const isCallout = variant === CTA_VARIANT.CALLOUT;
  const resolvedPosition = isCallout
    ? undefined
    : (contentPosition ?? CONTENT_ALIGNMENT.LEFT);
  const resolvedAlignment = isSplit
    ? contentAlignment
    : (contentAlignment ?? CONTENT_ALIGNMENT.LEFT);

  const s = ctaModuleVariants({
    variant,
    tone,
    position: resolvedPosition,
    alignment: resolvedAlignment,
    mobileMediaOrder: isSplit
      ? (mobileMediaOrder ?? MEDIA_ORDER.LAST)
      : undefined,
    wrapped: isWrapped,
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
      className={s.root({
        class: [banner?.root(), banner?.copy(), className],
      })}
      data-testid={dataTestId}
    >
      <div className={s.body()}>
        {eyebrow && (
          <Eyebrow className={s.eyebrow({ class: banner?.title() })}>
            {eyebrow}
          </Eyebrow>
        )}
        <div className={s.group({ class: banner?.block() })}>
          <Heading
            id={headingId}
            level={2}
            visual="section"
            className={s.heading({ class: banner?.title() })}
          >
            {heading}
          </Heading>
          {supportingText && (
            <p className={s.text({ class: banner?.text() })}>
              {supportingText}
            </p>
          )}
          {content && (
            <Prose className={s.text({ class: banner?.text() })}>
              {content}
            </Prose>
          )}
        </div>
        {actions && (
          <div className={s.actions({ class: banner?.actions() })}>
            {actions}
          </div>
        )}
        {footnote && (
          <p
            className={s.footnote({
              class: [banner?.block(), banner?.text()],
            })}
          >
            {footnote}
          </p>
        )}
      </div>
      {image &&
        (banner ? (
          <div className={s.media({ class: banner.media() })}>{image}</div>
        ) : (
          <MediaFrame ratio="video" className={s.media()}>
            {image}
          </MediaFrame>
        ))}
      {banner && <div className={banner.overlay()} aria-hidden="true" />}
    </div>
  );
};
