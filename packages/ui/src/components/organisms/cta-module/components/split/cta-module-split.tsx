import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  MEDIA_ORDER,
  type TBrandVariant,
  type TContentAlignment,
  type TMediaOrder,
} from '@blog/config';
import { CtaModuleLayout } from '@blog/ui/components/organisms/cta-module/components/layout/cta-module-layout';
import type { CtaModuleSlotParts } from '@blog/ui/components/organisms/cta-module/cta-module-slot-parts';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import type { TCompoundChildren } from '@blog/ui/lib/react';

export type TCtaModuleSplitProps = IWithClassName &
  IWithDataTestId & {
    tone: TBrandVariant;
    heading: string;
    headingId?: string;
    contentPosition?: TContentAlignment;
    contentAlignment?: TContentAlignment;
    mobileMediaOrder?: TMediaOrder;
    children?: TCompoundChildren<typeof CtaModuleSlotParts>;
  };

/** A call-to-action card with its copy beside its image. */
export const CtaModuleSplit = ({
  tone,
  heading,
  headingId,
  contentPosition = CONTENT_ALIGNMENT.LEFT,
  contentAlignment,
  mobileMediaOrder = MEDIA_ORDER.LAST,
  children,
  className,
  dataTestId,
}: TCtaModuleSplitProps) => (
  <CtaModuleLayout
    styles={ctaModuleVariants({
      variant: CTA_VARIANT.SPLIT,
      tone,
      position: contentPosition,
      alignment: contentAlignment,
      mobileMediaOrder,
    })}
    heading={heading}
    headingId={headingId}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </CtaModuleLayout>
);
