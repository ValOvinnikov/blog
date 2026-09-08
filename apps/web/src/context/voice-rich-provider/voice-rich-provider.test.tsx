import type { TVoicePortableText } from '@blog/config';
import { renderElement, screen } from '@web/testing/custom-render';
import type { TVoiceRichFieldId } from '@web/utils/resolve-voice-rich-fields';

import { useVoiceRich, VoiceRichProvider } from './voice-rich-provider';

const richTextOf = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text }],
  },
];

const OVERRIDE_VALUE = richTextOf('Nothing published yet.');

const VALUES = {
  blogListEmpty: OVERRIDE_VALUE,
} as unknown as Record<TVoiceRichFieldId, TVoicePortableText>;

const ReadVoiceRich = ({ id }: { id: TVoiceRichFieldId }) => {
  const value = useVoiceRich(id);
  return <span data-testid="voice-rich">{value[0]?.children[0]?.text}</span>;
};

describe(`<${VoiceRichProvider.name}/>`, () => {
  it('renders children', () => {
    renderElement(
      <VoiceRichProvider values={VALUES}>
        <p>Article body</p>
      </VoiceRichProvider>,
    );

    expect(screen.getByText('Article body')).toBeVisible();
  });

  it('exposes the resolved value for a given voice field id, unflattened', () => {
    renderElement(
      <VoiceRichProvider values={VALUES}>
        <ReadVoiceRich id="blogListEmpty" />
      </VoiceRichProvider>,
    );

    expect(screen.getByTestId('voice-rich')).toHaveTextContent(
      'Nothing published yet.',
    );
  });

  it('throws when read outside a VoiceRichProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderElement(<ReadVoiceRich id="blogListEmpty" />)).toThrow(
      'useVoiceRich must be used within a VoiceRichProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
