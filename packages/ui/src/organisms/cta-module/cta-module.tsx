import {
  CTA_ALIGNMENT,
  CTA_MOBILE_MEDIA_ORDER,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TCtaAlignment,
  type TCtaMobileMediaOrder,
  type TCtaVariant,
} from '@blog/config';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { Prose } from '@blog/ui/atoms/prose';
import type { ReactNode } from 'react';

import {
  ctaModuleVariants,
  type TCtaModuleVariants,
} from './cta-module-variants';

export type TCtaModuleProps = IWithClassName &
  IWithDataTestId & {
    variant: TCtaVariant;
    /** Card fill for Split/Callout, or the background-image overlay tint for Banner. */
    tone: TBrandVariant;
    eyebrow?: string;
    heading: string;
    headingId?: string;
    supportingText?: string;
    /** Pre-rendered basic Portable Text, built by the web layer. */
    content?: ReactNode;
    /** Pre-rendered `<img>`/`next/image`, required by the schema for Banner and Split. */
    image?: ReactNode;
    /** Pre-rendered action buttons/links, built by the web layer — a plain slot. */
    actions?: ReactNode;
    footnote?: string;
    /** Where the content block sits relative to the image — not applicable on Callout. */
    contentPosition?: TCtaAlignment;
    /** How text and actions align within the content block, on all three variants. */
    contentAlignment?: TCtaAlignment;
    /** Split only. Defaults to `LAST` (image collapses below content on mobile). */
    mobileMediaOrder?: TCtaMobileMediaOrder;
    /**
     * Drops this component's own top margin. Set when a parent (e.g. `Section`)
     * already owns the vertical spacing around it, so the two don't stack.
     */
    isWrapped?: TCtaModuleVariants['wrapped'];
  };

/**
 * CtaModule — page-builder organism rendering a call-to-action in one of
 * three layouts. `content`/`image`/`actions` are pre-rendered nodes the web
 * layer builds; this component never constructs a link or image itself. DOM
 * order is always heading/text/actions before the image — `contentPosition`/
 * `mobileMediaOrder` only change the visual position via CSS.
 */
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
  className,
  dataTestId,
}: TCtaModuleProps) => {
  const isSplit = variant === CTA_VARIANT.SPLIT;
  const isBanner = variant === CTA_VARIANT.BANNER;
  const isCallout = variant === CTA_VARIANT.CALLOUT;
  const resolvedPosition = isCallout
    ? undefined
    : (contentPosition ?? CTA_ALIGNMENT.LEFT);
  const resolvedAlignment = isSplit
    ? contentAlignment
    : (contentAlignment ??
      (isBanner ? CTA_ALIGNMENT.LEFT : CTA_ALIGNMENT.CENTER));

  const s = ctaModuleVariants({
    variant,
    tone,
    position: resolvedPosition,
    alignment: resolvedAlignment,
    mobileMediaOrder: isSplit
      ? (mobileMediaOrder ?? CTA_MOBILE_MEDIA_ORDER.LAST)
      : undefined,
    wrapped: isWrapped,
  });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.body()}>
        {eyebrow && <Eyebrow className={s.eyebrow()}>{eyebrow}</Eyebrow>}
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
        {actions && <div className={s.actions()}>{actions}</div>}
        {footnote && <p className={s.footnote()}>{footnote}</p>}
      </div>
      {image && <div className={s.media()}>{image}</div>}
      {isBanner && <div className={s.overlay()} aria-hidden="true" />}
    </div>
  );
};
