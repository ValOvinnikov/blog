import { faker } from '@faker-js/faker';
import type { TVoicePortableText } from '@shinefold/config';
import { renderElement, screen } from '@web/testing/custom-render';
import {
  MOCK_VOICE_BOLD_TEXT,
  MOCK_VOICE_ITALIC_TEXT,
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
  mockVoiceRichTextBlocks,
} from '@web/testing/shared/voice/fixtures';

import { VoiceRichText } from './voice-rich-text';

faker.seed(6007);

const MOCK_FORMATTED_VALUE = mockFormattedVoiceRich();
const MOCK_FIRST_LINE = faker.lorem.sentence();
const MOCK_SECOND_LINE = faker.lorem.sentence();
const MOCK_TWO_BLOCK_VALUE = mockVoiceRichTextBlocks([
  MOCK_FIRST_LINE,
  MOCK_SECOND_LINE,
]);

const renderInParagraph = (value: TVoicePortableText) =>
  renderElement(
    <p>
      <VoiceRichText value={value} />
    </p>,
  );

describe(`<${VoiceRichText.name}/>`, () => {
  describe('with a single formatted block', () => {
    beforeEach(() => {
      renderInParagraph(MOCK_FORMATTED_VALUE);
    });

    it('renders an authored link as a working link', () => {
      const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });

      expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
    });

    it('renders bold and italic marks', () => {
      const bold = screen.getByText(MOCK_VOICE_BOLD_TEXT, {
        selector: 'strong',
      });
      const italic = screen.getByText(MOCK_VOICE_ITALIC_TEXT, {
        selector: 'em',
      });

      expect(bold).toBeVisible();
      expect(italic).toBeVisible();
    });

    it('adds no paragraph of its own', () => {
      const paragraphs = screen.getAllByRole('paragraph');

      expect(paragraphs).toHaveLength(1);
    });
  });

  it('renders each block of a multi-block value as a line in one paragraph', () => {
    renderInParagraph(MOCK_TWO_BLOCK_VALUE);

    const paragraphs = screen.getAllByRole('paragraph');
    const firstLine = screen.getByText(MOCK_FIRST_LINE, { selector: 'span' });
    const secondLine = screen.getByText(MOCK_SECOND_LINE, { selector: 'span' });

    expect(paragraphs).toHaveLength(1);
    expect(firstLine).toBeVisible();
    expect(secondLine).toBeVisible();
  });
});
