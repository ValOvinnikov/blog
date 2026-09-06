import {
  IMAGE_LAYOUT,
  type IBodyImageBlock,
  type TPortableTextBody,
} from '@blog/config';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  richTextBlock,
  richTextSpan,
} from '@web/testing/shared/portable-text-renderer/fixtures';

import { segmentPortableTextBody } from './segment-portable-text-body';

const fullBleedImage = (key: string): IBodyImageBlock => {
  return {
    _type: 'bodyImage',
    _key: key,
    image: makeSanityImage({ alt: 'A scenic mountain range' }),
    layout: IMAGE_LAYOUT.FULL_BLEED,
  };
};

describe('segmentPortableTextBody', () => {
  it('collapses a body with no FULL_BLEED image into a single PROSE segment holding every block, in order', () => {
    const value: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('Heading')]),
      richTextBlock('normal', [richTextSpan('Paragraph')]),
      {
        _type: 'bodyImage',
        _key: 'inline-1',
        image: makeSanityImage({ alt: 'Inline' }),
        layout: IMAGE_LAYOUT.INLINE,
      },
    ];

    expect(segmentPortableTextBody(value)).toEqual([
      { kind: 'PROSE', blocks: value },
    ]);
  });

  it('returns an empty segment list for an empty body', () => {
    expect(segmentPortableTextBody([])).toEqual([]);
  });

  it('splits a FULL_BLEED image out into its own BREAKOUT segment, between the surrounding PROSE runs', () => {
    const before = richTextBlock('normal', [richTextSpan('Before')]);
    const image = fullBleedImage('image-1');
    const after = richTextBlock('normal', [richTextSpan('After')]);
    const value: TPortableTextBody = [before, image, after];

    expect(segmentPortableTextBody(value)).toEqual([
      { kind: 'PROSE', blocks: [before] },
      { kind: 'BREAKOUT', block: image },
      { kind: 'PROSE', blocks: [after] },
    ]);
  });

  it('emits a leading BREAKOUT segment with no preceding PROSE run when the body opens with a FULL_BLEED image', () => {
    const image = fullBleedImage('image-1');
    const after = richTextBlock('normal', [richTextSpan('After')]);

    expect(segmentPortableTextBody([image, after])).toEqual([
      { kind: 'BREAKOUT', block: image },
      { kind: 'PROSE', blocks: [after] },
    ]);
  });

  it('emits a trailing BREAKOUT segment with no following PROSE run when the body ends with a FULL_BLEED image', () => {
    const before = richTextBlock('normal', [richTextSpan('Before')]);
    const image = fullBleedImage('image-1');

    expect(segmentPortableTextBody([before, image])).toEqual([
      { kind: 'PROSE', blocks: [before] },
      { kind: 'BREAKOUT', block: image },
    ]);
  });

  it('emits back-to-back BREAKOUT segments for two consecutive FULL_BLEED images, with no empty PROSE run between them', () => {
    const first = fullBleedImage('image-1');
    const second = fullBleedImage('image-2');

    expect(segmentPortableTextBody([first, second])).toEqual([
      { kind: 'BREAKOUT', block: first },
      { kind: 'BREAKOUT', block: second },
    ]);
  });

  it('keeps a non-FULL_BLEED bodyImage (e.g. FLOAT_LEFT) inside its surrounding PROSE run, not split out', () => {
    const floatImage: IBodyImageBlock = {
      _type: 'bodyImage',
      _key: 'float-1',
      image: makeSanityImage({ alt: 'Floated' }),
      layout: IMAGE_LAYOUT.FLOAT_LEFT,
    };
    const value: TPortableTextBody = [
      richTextBlock('normal', [richTextSpan('Text')]),
      floatImage,
    ];

    expect(segmentPortableTextBody(value)).toEqual([
      { kind: 'PROSE', blocks: value },
    ]);
  });
});
