import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
} from '@shinefold/config';
import type { THeadingText } from '@shinefold/ui/components/atoms/heading';
import { CtaModuleLayout } from '@shinefold/ui/components/organisms/cta-module/components/layout/cta-module-layout';
import type { CtaModuleSlotParts } from '@shinefold/ui/components/organisms/cta-module/cta-module-slot-parts';
import { ctaModuleVariants } from '@shinefold/ui/components/organisms/cta-module/cta-module-variants';
import type { TCompoundChildren } from '@shinefold/ui/lib/react';

export type TCtaModuleCalloutProps = IWithClassName &
  IWithDataTestId &
  THeadingText & {
    tone: TBrandVariant;
    headingId?: string;
    contentAlignment?: TContentAlignment;
    children?: TCompoundChildren<typeof CtaModuleSlotParts>;
  };

/** A call-to-action card with its image above its copy. */
export const CtaModuleCallout = ({
  tone,
  heading,
  headingPieces,
  headingId,
  contentAlignment = CONTENT_ALIGNMENT.LEFT,
  children,
  className,
  dataTestId,
}: TCtaModuleCalloutProps) => (
  <CtaModuleLayout
    tone={tone}
    styles={ctaModuleVariants({
      variant: CTA_VARIANT.CALLOUT,
      alignment: contentAlignment,
    })}
    heading={heading}
    headingPieces={headingPieces}
    headingId={headingId}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </CtaModuleLayout>
);
