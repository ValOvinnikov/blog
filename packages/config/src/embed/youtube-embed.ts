import type { TMaybeUndefined } from '@blog/config/types';
import { hasLength } from '@blog/utils/primitives';

import {
  EMBED_ORIGIN,
  EMBED_PROVIDER,
  MEDIA_RATIO,
} from '@blog/config/constants';

import type { TEmbedParser } from './embed-parser';

const YOUTUBE_ID = /^[\w-]{11}$/;
const START_TIME = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const toStartSeconds = (time: TMaybeUndefined<string>) => {
  const match = time ? START_TIME.exec(time) : null;

  if (!match) {
    return undefined;
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  const total =
    Number(hours) * SECONDS_PER_HOUR +
    Number(minutes) * SECONDS_PER_MINUTE +
    Number(seconds);

  return total > 0 ? total : undefined;
};

const toYoutubeVideo = (
  host: string,
  url: URL,
  [first, second, ...rest]: string[],
) => {
  if (host === 'youtu.be' && !second) {
    return { id: first, isShort: false };
  }

  if (host !== 'youtube.com' || hasLength(rest)) {
    return undefined;
  }

  if (first === 'watch' && !second) {
    return { id: url.searchParams.get('v') ?? undefined, isShort: false };
  }

  return first === 'shorts' ? { id: second, isShort: true } : undefined;
};

export const parseYoutubeEmbed: TEmbedParser = (host, url, segments) => {
  const video = toYoutubeVideo(host, url, segments);

  if (!video?.id || !YOUTUBE_ID.test(video.id)) {
    return undefined;
  }

  const embedUrl = new URL(`${EMBED_ORIGIN.YOUTUBE}/embed/${video.id}`);
  const start = toStartSeconds(url.searchParams.get('t') ?? undefined);

  if (start) {
    embedUrl.searchParams.set('start', String(start));
  }

  return {
    provider: EMBED_PROVIDER.YOUTUBE,
    embedUrl: embedUrl.href,
    ratio: video.isShort ? MEDIA_RATIO.VERTICAL : MEDIA_RATIO.VIDEO,
  };
};
