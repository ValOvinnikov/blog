import type { TVoicePortableText } from '@blog/config';
import { renderElement, screen } from '@web/testing/custom-render';
import { makeFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';

import { VoiceRichText } from './voice-rich-text';

vi.mock('@web/i18n/navigation');

const LINKED_VALUE = makeFormattedVoiceRich({
  linkText: 'the guide',
  href: 'https://example.com',
});

const TWO_BLOCK_VALUE: TVoicePortableText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [{ _type: 'span', _key: 's1', text: 'First line' }],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    children: [{ _type: 'span', _key: 's2', text: 'Second line' }],
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

    expect(screen.getByRole('link', { name: 'the guide' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('renders bold and italic marks', () => {
    renderInParagraph(LINKED_VALUE);

    expect(screen.getByText('bold', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('italic', { selector: 'em' })).toBeVisible();
  });

  it('adds no paragraph of its own for a single block', () => {
    renderInParagraph(LINKED_VALUE);

    expect(screen.getAllByRole('paragraph')).toHaveLength(1);
  });

  it('renders each block of a multi-block value as its own line inside the one paragraph', () => {
    renderInParagraph(TWO_BLOCK_VALUE);

    expect(screen.getAllByRole('paragraph')).toHaveLength(1);
    expect(screen.getByText('First line', { selector: 'span' })).toBeVisible();
    expect(screen.getByText('Second line', { selector: 'span' })).toBeVisible();
  });
});
