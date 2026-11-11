import {
  CONSENT_CATEGORY,
  EMBED_PROVIDER,
  MEDIA_RATIO,
  type IWithClassName,
  type IWithDataTestId,
  type TEmbedProvider,
} from '@blog/config';
import type { TEmbed } from '@blog/service';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import { ConsentGate } from '@web/components/shared/consent-gate';

import { EmbedConsentPlaceholder } from './components/embed-consent-placeholder/embed-consent-placeholder';
import { embedFrameVariants } from './embed-frame-variants';

const SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-popups';
const VIDEO_PROVIDERS: readonly TEmbedProvider[] = [
  EMBED_PROVIDER.YOUTUBE,
  EMBED_PROVIDER.VIMEO,
  EMBED_PROVIDER.LOOM,
];

export interface IEmbedFrameProps extends IWithClassName, IWithDataTestId {
  embed: TEmbed;
}

export const EmbedFrame = ({
  embed,
  className,
  dataTestId,
}: IEmbedFrameProps) => {
  const { provider, embedUrl, ratio, title, caption } = embed;
  const s = embedFrameVariants({ isVertical: ratio === MEDIA_RATIO.VERTICAL });

  return (
    <figure className={s.root({ class: className })} data-testid={dataTestId}>
      <ConsentGate
        category={CONSENT_CATEGORY.EXTERNAL_MEDIA}
        pending={<MediaFrame ratio={ratio} className={s.frame()} />}
        fallback={
          <EmbedConsentPlaceholder
            provider={provider}
            title={title}
            ratio={ratio}
            className={s.frame()}
          />
        }
      >
        <MediaFrame ratio={ratio} className={s.frame()}>
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox={
              provider === EMBED_PROVIDER.CAL
                ? `${SANDBOX} allow-forms`
                : SANDBOX
            }
            allow={
              VIDEO_PROVIDERS.includes(provider)
                ? 'fullscreen; encrypted-media'
                : undefined
            }
            className={s.iframe()}
          />
        </MediaFrame>
      </ConsentGate>
      {caption && <figcaption className={s.caption()}>{caption}</figcaption>}
    </figure>
  );
};
