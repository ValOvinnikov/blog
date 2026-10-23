import type { TVoicePortableText } from '@blog/config';
import { renderElement, screen } from '@web/testing/custom-render';
import {
  MOCK_VOICE_BOLD_TEXT,
  MOCK_VOICE_ITALIC_TEXT,
  MOCK_VOICE_LINK_HREF,
  MOCK_VOICE_LINK_TEXT,
  mockFormattedVoiceRich,
} from '@web/testing/shared/voice/fixtures';

import { VoiceRichText } from './voice-rich-text';

vi.mock('@web/i18n/navigation');

const LINKED_VALUE = mockFormattedVoiceRich();

const FIRST_LINE = 'First line';
const SECOND_LINE = 'Second line';

const TWO_BLOCK_VALUE: TVoicePortableText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text: FIRST_LINE }],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    children: [{ _type: 'span', _key: 's2', text: SECOND_LINE }],
  },
];

const renderInParagraph = (value: TVoicePortableText) =>
  renderElement(
    <p>
      <VoiceRichText value={value} />
    </p>,
  );

describe(`<${VoiceRichText.name}/>`, () => {
  it('renders an authored link as a working link', () => {
    renderInParagraph(LINKED_VALUE);

    const link = screen.getByRole('link', { name: MOCK_VOICE_LINK_TEXT });

    expect(link).toHaveAttribute('href', MOCK_VOICE_LINK_HREF);
  });

  it('renders bold and italic marks', () => {
    renderInParagraph(LINKED_VALUE);

    const bold = screen.getByText(MOCK_VOICE_BOLD_TEXT, { selector: 'strong' });
    const italic = screen.getByText(MOCK_VOICE_ITALIC_TEXT, { selector: 'em' });

    expect(bold).toBeVisible();
    expect(italic).toBeVisible();
  });

  it('adds no paragraph of its own for a single block', () => {
    renderInParagraph(LINKED_VALUE);

    const paragraphs = screen.getAllByRole('paragraph');

    expect(paragraphs).toHaveLength(1);
  });

  it('renders each block of a multi-block value as a line in one paragraph', () => {
    renderInParagraph(TWO_BLOCK_VALUE);

    const paragraphs = screen.getAllByRole('paragraph');
    const firstLine = screen.getByText(FIRST_LINE, { selector: 'span' });
    const secondLine = screen.getByText(SECOND_LINE, { selector: 'span' });

    expect(paragraphs).toHaveLength(1);
    expect(firstLine).toBeVisible();
    expect(secondLine).toBeVisible();
  });
});
