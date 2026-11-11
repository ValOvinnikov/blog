import { faker } from '@faker-js/faker';

import { EMBED_PROVIDER, MEDIA_RATIO } from '@blog/config/constants';

import { parseEmbedUrl } from './parse-embed-url';

faker.seed(3771);

const MOCK_YOUTUBE_ID = faker.string.alphanumeric(11);
const MOCK_VIMEO_ID = faker.string.numeric(8);
const MOCK_LOOM_ID = faker.string.hexadecimal({ length: 32, prefix: '' });
const MOCK_CAL_USER = faker.string.alpha(8);
const MOCK_CAL_EVENT = faker.string.alpha(6);
const MOCK_MAPS_PB = faker.string.alphanumeric(24);
const MOCK_YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${MOCK_YOUTUBE_ID}`;

const youtubeVideo = (embedUrl: string) => ({
  provider: EMBED_PROVIDER.YOUTUBE,
  embedUrl,
  ratio: MEDIA_RATIO.VIDEO,
});

describe('parseEmbedUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${MOCK_YOUTUBE_ID}`,
    `https://m.youtube.com/watch?v=${MOCK_YOUTUBE_ID}&feature=share`,
    `https://youtu.be/${MOCK_YOUTUBE_ID}?si=abc`,
  ])('maps the YouTube link %s to a nocookie embed', (url) => {
    expect(parseEmbedUrl(url)).toEqual(youtubeVideo(MOCK_YOUTUBE_EMBED));
  });

  it.each([
    ['90', 90],
    ['1m30s', 90],
    ['1h2m3s', 3723],
  ])('carries a YouTube start time of t=%s over as start=%i', (t, start) => {
    expect(parseEmbedUrl(`https://youtu.be/${MOCK_YOUTUBE_ID}?t=${t}`)).toEqual(
      youtubeVideo(`${MOCK_YOUTUBE_EMBED}?start=${String(start)}`),
    );
  });

  it('drops a start time it cannot read', () => {
    expect(
      parseEmbedUrl(`https://youtube.com/watch?v=${MOCK_YOUTUBE_ID}&t=soon`),
    ).toEqual(youtubeVideo(MOCK_YOUTUBE_EMBED));
  });

  it('shows a YouTube Short vertically', () => {
    expect(
      parseEmbedUrl(`https://www.youtube.com/shorts/${MOCK_YOUTUBE_ID}`),
    ).toEqual({
      provider: EMBED_PROVIDER.YOUTUBE,
      embedUrl: MOCK_YOUTUBE_EMBED,
      ratio: MEDIA_RATIO.VERTICAL,
    });
  });

  it('maps a Vimeo link to the Vimeo player', () => {
    expect(parseEmbedUrl(`https://vimeo.com/${MOCK_VIMEO_ID}`)).toEqual({
      provider: EMBED_PROVIDER.VIMEO,
      embedUrl: `https://player.vimeo.com/video/${MOCK_VIMEO_ID}`,
      ratio: MEDIA_RATIO.VIDEO,
    });
  });

  it('maps a Loom share link to its embed', () => {
    expect(parseEmbedUrl(`https://www.loom.com/share/${MOCK_LOOM_ID}`)).toEqual(
      {
        provider: EMBED_PROVIDER.LOOM,
        embedUrl: `https://www.loom.com/embed/${MOCK_LOOM_ID}`,
        ratio: MEDIA_RATIO.VIDEO,
      },
    );
  });

  it('keeps a Cal.com booking page on cal.com in embed mode', () => {
    expect(
      parseEmbedUrl(
        `https://cal.com/${MOCK_CAL_USER}/${MOCK_CAL_EVENT}?month=2026-11`,
      ),
    ).toEqual({
      provider: EMBED_PROVIDER.CAL,
      embedUrl: `https://cal.com/${MOCK_CAL_USER}/${MOCK_CAL_EVENT}?embed=true`,
      ratio: MEDIA_RATIO.PORTRAIT,
    });
  });

  it('keeps a Google Maps embed link as it is', () => {
    const embedUrl = `https://www.google.com/maps/embed?pb=${MOCK_MAPS_PB}`;

    expect(parseEmbedUrl(embedUrl)).toEqual({
      provider: EMBED_PROVIDER.GOOGLE_MAPS,
      embedUrl,
      ratio: MEDIA_RATIO.CLASSIC,
    });
  });

  it.each([
    'not a url',
    `ftp://youtu.be/${MOCK_YOUTUBE_ID}`,
    `https://example.com/watch?v=${MOCK_YOUTUBE_ID}`,
    `https://www.youtube.com/watch?v=short`,
    `https://www.youtube.com/embed/${MOCK_YOUTUBE_ID}`,
    'https://vimeo.com/channels/staffpicks',
    `https://www.loom.com/embed/${MOCK_LOOM_ID}`,
    'https://cal.com/',
    'https://www.google.com/maps/place/London',
    `https://maps.app.goo.gl/${MOCK_MAPS_PB}`,
    `https://youtube.com.evil.com/watch?v=${MOCK_YOUTUBE_ID}`,
    `https://evil.com/youtube.com/watch?v=${MOCK_YOUTUBE_ID}`,
    `https://youtube.com@evil.com/watch?v=${MOCK_YOUTUBE_ID}`,
    'javascript:alert(1)',
  ])('rejects %s', (url) => {
    expect(parseEmbedUrl(url)).toBeUndefined();
  });
});
