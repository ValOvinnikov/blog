import type { TVoicePortableText } from '@blog/config';
import { render, renderElement, screen } from '@web/testing/custom-render';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import type { TVoiceRichFieldId } from '@web/utils/resolve-voice-rich-fields';

import { useVoiceRich, VoiceRichProvider } from './voice-rich-provider';

const OVERRIDE_TEXT = 'Nothing published yet.';
const OVERRIDE_VALUE = mockVoiceRichText(OVERRIDE_TEXT);

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

    const body = screen.getByText('Article body');

    expect(body).toBeVisible();
  });

  it('exposes the resolved value for a given voice field id, unflattened', () => {
    renderElement(
      <VoiceRichProvider values={VALUES}>
        <ReadVoiceRich id="blogListEmpty" />
      </VoiceRichProvider>,
    );

    const voiceRich = screen.getByTestId('voice-rich');

    expect(voiceRich).toHaveTextContent(OVERRIDE_TEXT);
  });

  it('throws when read outside a VoiceRichProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<ReadVoiceRich id="blogListEmpty" />)).toThrow(
      'useVoiceRich must be used within a VoiceRichProvider',
    );

    consoleErrorSpy.mockRestore();
  });
});
