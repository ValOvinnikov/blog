import {
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
  type TContentAlignment,
  type TSpacingScale,
} from '@blog/config';
import { CtaModuleLayout } from '@blog/ui/components/organisms/cta-module/components/layout/cta-module-layout';
import type { CtaModuleSlotParts } from '@blog/ui/components/organisms/cta-module/cta-module-slot-parts';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import type { TCompoundChildren } from '@blog/ui/lib/react';
import { bannerVariants } from '@blog/ui/lib/styling';

export type TCtaModuleBannerProps = IWithClassName &
  IWithDataTestId & {
    tone: TBrandVariant;
    heading: string;
    headingId?: string;
    contentPosition?: TContentAlignment;
    contentAlignment?: TContentAlignment;
    spacingTop?: TSpacingScale;
    spacingBottom?: TSpacingScale;
    children?: TCompoundChildren<typeof CtaModuleSlotParts>;
  };

/** A full-bleed call-to-action band with its copy over a photo. */
export const CtaModuleBanner = ({
  tone,
  heading,
  headingId,
  contentPosition = CONTENT_ALIGNMENT.LEFT,
  contentAlignment = CONTENT_ALIGNMENT.LEFT,
  spacingTop,
  spacingBottom,
  children,
  className,
  dataTestId,
}: TCtaModuleBannerProps) => (
  <CtaModuleLayout
    styles={ctaModuleVariants({
      variant: CTA_VARIANT.BANNER,
      tone,
      position: contentPosition,
      alignment: contentAlignment,
    })}
    bannerStyles={bannerVariants({
      tone,
      position: contentPosition,
      spacingTop,
      spacingBottom,
    })}
    heading={heading}
    headingId={headingId}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </CtaModuleLayout>
);
