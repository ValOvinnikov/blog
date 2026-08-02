import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { toContentModule } from './transformer';

describe('toContentModule', () => {
  it('maps title and body straight through (both schema-required)', () => {
    const raw = makeRawContentModule({ title: 'About us' });

    const module = toContentModule(raw);

    expect(module.title).toBe('About us');
    expect(module.body).toHaveLength(1);
  });

  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: undefined,
          media: undefined,
          hotspot: undefined,
          crop: undefined,
          alt: 'A diagram',
          layout: 'INLINE',
        },
      ],
    });

    const module = toContentModule(raw);

    expect(module.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'INLINE',
    });
  });
});
