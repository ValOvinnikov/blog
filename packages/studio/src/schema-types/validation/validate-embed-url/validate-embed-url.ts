import { parseEmbedUrl, type TMaybeUndefined } from '@blog/config';

const toHost = (value: string) =>
  URL.canParse(value.trim()) ? new URL(value.trim()).hostname : undefined;

export const validateEmbedUrl = (
  value: TMaybeUndefined<string>,
): string | true =>
  !value || parseEmbedUrl(value)
    ? true
    : `${toHost(value) ?? 'This link'} can't be embedded. Use a link from YouTube, Vimeo, Loom, Cal.com or Google Maps.`;
