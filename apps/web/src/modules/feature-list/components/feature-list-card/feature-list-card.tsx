import {
  CARD_IMAGE_SHAPE,
  SIZE,
  type IWithDataTestId,
  type TCardImageShape,
} from '@blog/config';
import type { TFeatureListItem } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { stretchedLinkVariants } from '@web/components/shared/stretched-link';

const CARD_IMAGE_SHAPE_TO_MEDIA_SHAPE: Record<
  TCardImageShape,
  'wide' | 'square' | 'circle'
> = {
  [CARD_IMAGE_SHAPE.WIDE]: 'wide',
  [CARD_IMAGE_SHAPE.SQUARE]: 'square',
  [CARD_IMAGE_SHAPE.CIRCLE]: 'circle',
};

// `MediaCard.Media`'s `circle` shape renders at a fixed CSS `size-28`
// (112px) regardless of grid width, so its request is a fixed 2x-density
// 224px rather than a `sizes`-driven fraction of the column.
const CIRCLE_IMAGE_SIZE = 224;
const WIDE_IMAGE_HEIGHT = 360;
const SQUARE_IMAGE_SIZE = 640;

export interface IFeatureListCardProps extends IWithDataTestId {
  item: TFeatureListItem;
  imageShape: TCardImageShape;
  align: 'left' | 'center';
  imageSizes: string;
  headingLevel: THeadingLevel;
  hasAnyImage?: boolean;
}

export const FeatureListCard = ({
  item,
  imageShape,
  align,
  imageSizes,
  headingLevel,
  hasAnyImage,
  dataTestId,
}: IFeatureListCardProps) => {
  const { heading, supportingText } = item.headingBlock;
  const mediaShape =
    item.sanityImage || hasAnyImage
      ? CARD_IMAGE_SHAPE_TO_MEDIA_SHAPE[imageShape]
      : 'icon';

  return (
    <MediaCard
      excerpt={supportingText}
      align={align}
      isInteractive={Boolean(item.link)}
      dataTestId={dataTestId}
    >
      <MediaCard.Media
        shape={mediaShape}
        align={align}
        dataTestId="feature-card-media"
      >
        {item.sanityImage ? (
          <SanityImage
            image={item.sanityImage}
            width={
              mediaShape === 'circle' ? CIRCLE_IMAGE_SIZE : SQUARE_IMAGE_SIZE
            }
            height={
              mediaShape === 'circle'
                ? CIRCLE_IMAGE_SIZE
                : mediaShape === 'wide'
                  ? WIDE_IMAGE_HEIGHT
                  : SQUARE_IMAGE_SIZE
            }
            sizes={mediaShape === 'circle' ? undefined : imageSizes}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          item.icon &&
          (mediaShape === 'icon' ? (
            <Icon
              name={item.icon}
              size={SIZE.LG}
              dataTestId="feature-card-icon"
            />
          ) : (
            <div
              className="bg-brand-primary-muted text-brand-primary group-hover:bg-surface group-focus-within:bg-surface flex size-full items-center justify-center"
              data-testid="feature-card-icon-panel"
            >
              <Icon
                name={item.icon}
                size={SIZE.LG}
                dataTestId="feature-card-icon"
              />
            </div>
          ))
        )}
      </MediaCard.Media>
      <MediaCard.Title level={headingLevel}>
        {item.link ? (
          <SmartLink
            href={item.link.href}
            target={item.link.target}
            aria-label={item.link.ariaLabel}
            className={stretchedLinkVariants()}
          >
            {heading}
          </SmartLink>
        ) : (
          heading
        )}
      </MediaCard.Title>
    </MediaCard>
  );
};
