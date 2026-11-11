import type { TMaybeUndefined, TParsedEmbed } from '@blog/config/types';
import { hasLength } from '@blog/utils/primitives';

import { EMBED_PROVIDER, MEDIA_RATIO } from '@blog/config/constants';

import type { TEmbedParser } from './embed-parser';
import { parseYoutubeEmbed } from './youtube-embed';

const SUPPORTED_PROTOCOLS = ['https:', 'http:'];
const HOST_PREFIX = /^(?:www|m)\./;
const VIMEO_ID = /^\d+$/;
const LOOM_ID = /^[\da-f]+$/i;
const CAL_SEGMENT = /^[\w.-]+$/;
const CAL_MAX_SEGMENTS = 2;

const parseVimeoEmbed: TEmbedParser = (host, _url, [id, ...rest]) =>
  host === 'vimeo.com' && id && VIMEO_ID.test(id) && !hasLength(rest)
    ? {
        provider: EMBED_PROVIDER.VIMEO,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        ratio: MEDIA_RATIO.VIDEO,
      }
    : undefined;

const parseLoomEmbed: TEmbedParser = (host, _url, [kind, id, ...rest]) =>
  host === 'loom.com' &&
  kind === 'share' &&
  id &&
  LOOM_ID.test(id) &&
  !hasLength(rest)
    ? {
        provider: EMBED_PROVIDER.LOOM,
        embedUrl: `https://www.loom.com/embed/${id}`,
        ratio: MEDIA_RATIO.VIDEO,
      }
    : undefined;

const parseCalEmbed: TEmbedParser = (host, _url, segments) =>
  host === 'cal.com' &&
  hasLength(segments) &&
  segments.length <= CAL_MAX_SEGMENTS &&
  segments.every((segment) => CAL_SEGMENT.test(segment))
    ? {
        provider: EMBED_PROVIDER.CAL,
        embedUrl: `https://cal.com/${segments.join('/')}?embed=true`,
        ratio: MEDIA_RATIO.PORTRAIT,
      }
    : undefined;

const parseGoogleMapsEmbed: TEmbedParser = (host, url) =>
  host === 'google.com' &&
  url.pathname === '/maps/embed' &&
  url.searchParams.get('pb')
    ? {
        provider: EMBED_PROVIDER.GOOGLE_MAPS,
        embedUrl: `https://www.google.com/maps/embed${url.search}`,
        ratio: MEDIA_RATIO.CLASSIC,
      }
    : undefined;

const EMBED_PARSERS: readonly TEmbedParser[] = [
  parseYoutubeEmbed,
  parseVimeoEmbed,
  parseLoomEmbed,
  parseCalEmbed,
  parseGoogleMapsEmbed,
];

export const parseEmbedUrl = (value: string): TMaybeUndefined<TParsedEmbed> => {
  const trimmed = value.trim();

  if (!URL.canParse(trimmed)) {
    return undefined;
  }

  const url = new URL(trimmed);

  if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
    return undefined;
  }

  const host = url.hostname.replace(HOST_PREFIX, '');
  const segments = url.pathname.split('/').filter(Boolean);

  for (const parse of EMBED_PARSERS) {
    const embed = parse(host, url, segments);

    if (embed) {
      return embed;
    }
  }

  return undefined;
};
