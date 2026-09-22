import type { TPortableTextBody } from '@blog/service';
import { Prose } from '@blog/ui/atoms/prose';
import {
  createAsideOverride,
  PortableText,
  renderBodyImage,
  type TAsideKindLabels,
} from '@web/components/shared/portable-text';
import { segmentPortableTextBody } from '@web/utils/segment-portable-text-body';
import { Fragment } from 'react';

import { postBodyVariants } from './post-body-variants';

export interface IPostBodyProps {
  value: TPortableTextBody;
  asideKindLabels?: TAsideKindLabels;
}

const s = postBodyVariants();

export const PostBody = ({ value, asideKindLabels }: IPostBodyProps) => {
  const components = createAsideOverride(asideKindLabels);
  const segments = segmentPortableTextBody(value);
  const hasBreakout = segments.some((segment) => segment.kind === 'BREAKOUT');

  if (!hasBreakout) {
    return (
      <Prose className={s.root()}>
        <PortableText value={value} components={components} />
      </Prose>
    );
  }

  return (
    <div className={s.segments()}>
      {segments.map((segment, index) =>
        segment.kind === 'PROSE' ? (
          <Prose key={`prose-${index}`} className={s.root()}>
            <PortableText value={segment.blocks} components={components} />
          </Prose>
        ) : (
          <Fragment key={segment.block._key}>
            {renderBodyImage(segment.block)}
          </Fragment>
        ),
      )}
    </div>
  );
};
