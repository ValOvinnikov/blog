import type { IWithDataTestId } from '@blog/config';
import type { TFeatureHighlightItem } from '@blog/service';
import { Heading } from '@blog/ui/components/atoms/heading';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import { Prose } from '@blog/ui/components/atoms/prose';
import { ActionGroup } from '@web/components/shared/action-group';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';

import { featureHighlightRowVariants } from './feature-highlight-row-variants';

export type TFeatureHighlightMediaSide = 'start' | 'end';

export interface IFeatureHighlightRowProps extends IWithDataTestId {
  item: TFeatureHighlightItem;
  mediaSide: TFeatureHighlightMediaSide;
}

export const FeatureHighlightRow = ({
  item,
  mediaSide,
  dataTestId,
}: IFeatureHighlightRowProps) => {
  const s = featureHighlightRowVariants({
    mediaSide,
    hasImage: Boolean(item.image),
  });

  return (
    <div
      data-media-side={mediaSide}
      className={s.root()}
      data-testid={dataTestId}
    >
      {item.image && (
        <div className={s.media()}>
          <MediaFrame ratio="classic" dataTestId={`${dataTestId}-media`}>
            <SanityImage
              image={item.image}
              width={800}
              height={600}
              sizes="(min-width: 768px) 50vw, 100vw"
              loading="lazy"
              className="size-full object-cover"
            />
          </MediaFrame>
        </div>
      )}
      <div className={s.text()}>
        <Heading level={3} className={s.heading()}>
          {item.heading}
        </Heading>
        <Prose className={s.body()}>
          <PortableText value={item.body} />
        </Prose>
        {item.action && (
          <div className={s.actions()}>
            <ActionGroup actions={[item.action]} />
          </div>
        )}
      </div>
    </div>
  );
};
