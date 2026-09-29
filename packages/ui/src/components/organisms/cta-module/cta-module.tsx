import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  MEDIA_ORDER,
  SPACING_SCALE,
  type TBrandVariant,
  type TContentAlignment,
  type TCtaVariant,
  type TMediaOrder,
  type TSpacingScale,
} from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Prose } from '@blog/ui/components/atoms/prose';
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
    : (contentAlignment ??
      (isBanner ? CONTENT_ALIGNMENT.LEFT : CONTENT_ALIGNMENT.CENTER));

  const s = ctaModuleVariants({
    variant,
    tone,
    position: resolvedPosition,
    alignment: resolvedAlignment,
    mobileMediaOrder: isSplit
      ? (mobileMediaOrder ?? MEDIA_ORDER.LAST)
      : undefined,
    wrapped: isWrapped,
    spacingTop: isBanner ? (spacingTop ?? SPACING_SCALE.MD) : undefined,
    spacingBottom: isBanner ? (spacingBottom ?? SPACING_SCALE.MD) : undefined,
  });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.body()}>
        {eyebrow && <Eyebrow className={s.eyebrow()}>{eyebrow}</Eyebrow>}
        <div className={s.group()}>
          <Heading
            id={headingId}
            level={2}
            visual="section"
            className={s.heading()}
          >
            {heading}
          </Heading>
          {supportingText && <p className={s.text()}>{supportingText}</p>}
          {content && <Prose className={s.text()}>{content}</Prose>}
        </div>
        {actions && <div className={s.actions()}>{actions}</div>}
        {footnote && <p className={s.footnote()}>{footnote}</p>}
      </div>
      {image && <div className={s.media()}>{image}</div>}
      {isBanner && <div className={s.overlay()} aria-hidden="true" />}
    </div>
  );
};
