import {
  service,
  type TImageTransformOptions,
  urlForSanityImage,
} from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import type { TTestimonialCardItem } from './testimonial-card';
import { TestimonialModuleView } from './testimonial-module-view';

export interface ITestimonialModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

const TESTIMONIAL_AVATAR_SIZE_PX = 112;
const TESTIMONIAL_AVATAR_TRANSFORM: TImageTransformOptions = {
  width: TESTIMONIAL_AVATAR_SIZE_PX,
  height: TESTIMONIAL_AVATAR_SIZE_PX,
  fit: 'crop',
  quality: 75,
};

export const TestimonialModule = async ({
  id,
  tenant,
}: ITestimonialModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.testimonial.v1.getTestimonialModule(
    id,
    tenantContext,
  );

  if (!result.ok) return null;
  if (result.data.testimonials.length === 0) return null;

  const { showImages, testimonials, ...testimonialModuleData } = result.data;
  const testimonialCardItems: TTestimonialCardItem[] = testimonials.map(
    ({ photo, ...item }) => ({
      ...item,
      avatarSrc:
        showImages && photo
          ? urlForSanityImage(
              photo,
              tenantContext,
              TESTIMONIAL_AVATAR_TRANSFORM,
            )
          : undefined,
      avatarAlt: showImages ? photo?.alt : undefined,
    }),
  );

  return (
    <TestimonialModuleView
      {...testimonialModuleData}
      testimonials={testimonialCardItems}
      titleId={`testimonial-${id}`}
      dataTestId={`testimonial-module-${id}`}
    />
  );
};
