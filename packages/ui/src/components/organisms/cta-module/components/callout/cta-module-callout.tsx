import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
} from '@blog/config';
import { CtaModuleLayout } from '@blog/ui/components/organisms/cta-module/components/layout/cta-module-layout';
import type { CtaModuleSlotParts } from '@blog/ui/components/organisms/cta-module/cta-module-slot-parts';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import type { TCompoundChildren } from '@blog/ui/lib/react';

export type TCtaModuleCalloutProps = IWithClassName &
  IWithDataTestId & {
    tone: TBrandVariant;
    heading: string;
    headingId?: string;
    contentAlignment?: TContentAlignment;
    children?: TCompoundChildren<typeof CtaModuleSlotParts>;
  };

/** A call-to-action card with its image above its copy. */
export const CtaModuleCallout = ({
  tone,
  heading,
  headingId,
  contentAlignment = CONTENT_ALIGNMENT.LEFT,
  children,
  className,
  dataTestId,
}: TCtaModuleCalloutProps) => (
  <CtaModuleLayout
    styles={ctaModuleVariants({
      variant: CTA_VARIANT.CALLOUT,
      tone,
      alignment: contentAlignment,
    })}
    heading={heading}
    headingId={headingId}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </CtaModuleLayout>
);
