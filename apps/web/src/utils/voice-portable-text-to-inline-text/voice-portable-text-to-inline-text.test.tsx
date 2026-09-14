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
  it('strips markDefs and the link mark key, leaving the span text untouched', () => {
    const result = voicePortableTextToInlineText(VOICE_VALUE);

    expect(result[0]?.markDefs).toBeUndefined();
    expect(result[0]?.children).toEqual([
      { _type: 'span', _key: 's1', text: 'Read the ', marks: [] },
      { _type: 'span', _key: 's2', text: 'docs', marks: [] },
      { _type: 'span', _key: 's3', text: ' for more.', marks: [] },
    ]);
  });

  it('produces a value InlineTextRenderer renders as plain text, not a dead anchor', () => {
    const setup = customRender(InlineTextRenderer, {
      value: voicePortableTextToInlineText(VOICE_VALUE),
    });

    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Read the docs for more.')).toBeVisible();
  });
});
