import type { TVoicePortableText } from '@blog/config';
import { BasicTextRenderer } from '@web/components/shared/basic-text-renderer';
import { customRender, screen } from '@web/testing/custom-render';

import { voicePortableTextToBasicText } from './voice-portable-text-to-basic-text';

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

describe(voicePortableTextToBasicText, () => {
  it("renames a link markDef's href to url, leaving other fields untouched", () => {
    const result = voicePortableTextToBasicText(VOICE_VALUE);

    expect(result[0]?.markDefs).toEqual([
      { _key: 'link-1', _type: 'link', url: 'https://example.com/docs' },
    ]);
    expect(result[0]?.children).toEqual(VOICE_VALUE[0]?.children);
  });

  it('produces a value BasicTextRenderer renders as a working anchor', () => {
    const setup = customRender(BasicTextRenderer, {
      value: voicePortableTextToBasicText(VOICE_VALUE),
    });

    setup();

    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute(
      'href',
      'https://example.com/docs',
    );
  });
});
