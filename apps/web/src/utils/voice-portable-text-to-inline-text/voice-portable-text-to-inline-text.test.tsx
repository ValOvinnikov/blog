import type { TVoicePortableText } from '@blog/config';
import { InlineTextRenderer } from '@web/components/shared/inline-text-renderer';
import { customRender, screen } from '@web/testing/custom-render';

import { voicePortableTextToInlineText } from './voice-portable-text-to-inline-text';

const VOICE_VALUE: TVoicePortableText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'Read the ', marks: [] },
      { _type: 'span', _key: 's2', text: 'docs', marks: ['link-1'] },
      { _type: 'span', _key: 's3', text: ' for more.', marks: [] },
    ],
    markDefs: [
      { _key: 'link-1', _type: 'link', href: 'https://example.com/docs' },
    ],
  },
];

describe(voicePortableTextToInlineText, () => {
  it('wraps a link markDef as a resolved linkRef mark', () => {
    const result = voicePortableTextToInlineText(VOICE_VALUE);

    expect(result[0]?.markDefs).toEqual([
      {
        _key: 'link-1',
        _type: 'linkRef',
        link: {
          label: 'https://example.com/docs',
          href: 'https://example.com/docs',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      },
    ]);
    expect(result[0]?.children).toEqual(VOICE_VALUE[0]?.children);
  });

  it('produces a value InlineTextRenderer renders as a working anchor', () => {
    const setup = customRender(InlineTextRenderer, {
      value: voicePortableTextToInlineText(VOICE_VALUE),
    });

    setup();

    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute(
      'href',
      'https://example.com/docs',
    );
  });
});
