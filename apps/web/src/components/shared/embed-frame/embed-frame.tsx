import {
  MEDIA_RATIO,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TEmbed } from '@blog/service';

import { EmbedGate } from './components/embed-gate/embed-gate';
import { embedFrameVariants } from './embed-frame-variants';

export interface IEmbedFrameProps extends IWithClassName, IWithDataTestId {
  embed: TEmbed;
}

export const EmbedFrame = ({
  embed,
  className,
  dataTestId,
}: IEmbedFrameProps) => {
  const { ratio, caption } = embed;
  const s = embedFrameVariants({ isVertical: ratio === MEDIA_RATIO.VERTICAL });

  return (
    <figure className={s.root({ class: className })} data-testid={dataTestId}>
      <EmbedGate
        embed={embed}
        frameClassName={s.frame()}
        iframeClassName={s.iframe()}
      />
      {caption && <figcaption className={s.caption()}>{caption}</figcaption>}
    </figure>
  );
};
