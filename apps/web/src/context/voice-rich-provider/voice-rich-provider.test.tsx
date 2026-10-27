import type { TVoicePortableText } from '@blog/config';
import { faker } from '@faker-js/faker';
import { render, renderElement, screen } from '@web/testing/custom-render';
import { mockVoiceRichText } from '@web/testing/shared/voice/fixtures';
import type { TVoiceRichFieldId } from '@web/utils/resolve-voice-rich-fields';

import { useVoiceRich, VoiceRichProvider } from './voice-rich-provider';

faker.seed(6012);

const MOCK_OVERRIDE_TEXT = faker.lorem.sentence();
const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_OVERRIDE_VALUE = mockVoiceRichText(MOCK_OVERRIDE_TEXT);

const VALUES = {
  blogListEmpty: MOCK_OVERRIDE_VALUE,
} as unknown as Record<TVoiceRichFieldId, TVoicePortableText>;

const ReadVoiceRich = ({ id }: { id: TVoiceRichFieldId }) => {
  const value = useVoiceRich(id);
  return <span data-testid="voice-rich">{value[0]?.children[0]?.text}</span>;
};

describe(`<${VoiceRichProvider.name}/>`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    renderElement(
      <VoiceRichProvider values={VALUES}>
        <p>{MOCK_BODY_TEXT}</p>
      </VoiceRichProvider>,
    );

    const body = screen.getByText(MOCK_BODY_TEXT);

    expect(body).toBeVisible();
  });

  it('exposes the resolved value for a voice field id', () => {
    renderElement(
      <VoiceRichProvider values={VALUES}>
        <ReadVoiceRich id="blogListEmpty" />
      </VoiceRichProvider>,
    );

    const voiceRich = screen.getByTestId('voice-rich');

    expect(voiceRich).toHaveTextContent(MOCK_OVERRIDE_TEXT);
  });

  it('throws when read outside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ReadVoiceRich id="blogListEmpty" />)).toThrow(
      'useVoiceRich must be used within a VoiceRichProvider',
    );
  });
});
