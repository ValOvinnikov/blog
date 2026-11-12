'use client';

import {
  CONSENT_CATEGORY,
  EMBED_PROVIDER,
  type TEmbedProvider,
  type TMaybeNull,
} from '@blog/config';
import type { TEmbed } from '@blog/service';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import { ConsentGate } from '@web/components/shared/consent-gate';
import { useConsent } from '@web/hooks/use-consent';
import { useRef } from 'react';

import { EmbedConsentPlaceholder } from './components/embed-consent-placeholder/embed-consent-placeholder';

const SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-popups';
const VIDEO_PROVIDERS: readonly TEmbedProvider[] = [
  EMBED_PROVIDER.YOUTUBE,
  EMBED_PROVIDER.VIMEO,
  EMBED_PROVIDER.LOOM,
];

export interface IEmbedGateProps {
  embed: TEmbed;
  frameClassName: string;
  iframeClassName: string;
}

export const EmbedGate = ({
  embed,
  frameClassName,
  iframeClassName,
}: IEmbedGateProps) => {
  const { provider, embedUrl, ratio, title } = embed;
  const { grant } = useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA);
  const isAllowedHereRef = useRef(false);

  const allow = () => {
    isAllowedHereRef.current = true;
    grant();
  };

  const focusIfAllowedHere = (iframe: TMaybeNull<HTMLIFrameElement>) => {
    if (!iframe || !isAllowedHereRef.current) return;
    isAllowedHereRef.current = false;
    iframe.focus();
  };

  return (
    <ConsentGate
      category={CONSENT_CATEGORY.EXTERNAL_MEDIA}
      pending={<MediaFrame ratio={ratio} className={frameClassName} />}
      fallback={
        <EmbedConsentPlaceholder
          provider={provider}
          title={title}
          ratio={ratio}
          onAllow={allow}
          className={frameClassName}
        />
      }
    >
      <MediaFrame ratio={ratio} className={frameClassName}>
        <iframe
          ref={focusIfAllowedHere}
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={
            provider === EMBED_PROVIDER.CAL ? `${SANDBOX} allow-forms` : SANDBOX
          }
          allow={
            VIDEO_PROVIDERS.includes(provider)
              ? 'fullscreen; encrypted-media'
              : undefined
          }
          className={iframeClassName}
        />
      </MediaFrame>
    </ConsentGate>
  );
};
