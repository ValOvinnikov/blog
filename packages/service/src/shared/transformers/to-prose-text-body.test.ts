import { makeRawSharedLink } from '@blog/service/testing/shared/fixtures';

import { toProseTextBody, type TRawProseTextBody } from './to-prose-text-body';

describe('toProseTextBody', () => {
  it('passes a block with no markDefs through unchanged', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-1', text: 'Hi.' }],
        markDefs: null,
      },
    ] as TRawProseTextBody;

    const result = toProseTextBody(raw);

    expect(result).toEqual([{ ...raw[0], markDefs: undefined }]);
  });

  it('leaves an href-based link mark untouched', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [{ _type: 'link', _key: 'mark-1', href: 'https://x.test' }],
      },
    ] as unknown as TRawProseTextBody;

    const result = toProseTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [{ _type: 'link', _key: 'mark-1', href: 'https://x.test' }],
    });
  });

  it('resolves a sharedLinkAnnotation mark to a view-model ILink', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [
          {
            _key: 'mark-1',
            _type: 'sharedLinkAnnotation',
            link: makeRawSharedLink({ url: 'https://example.com/bio' }),
          },
        ],
      },
    ] as TRawProseTextBody;

    const result = toProseTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [
        {
          _key: 'mark-1',
          _type: 'sharedLinkAnnotation',
          link: { href: 'https://example.com/bio' },
        },
      ],
    });
  });
});
