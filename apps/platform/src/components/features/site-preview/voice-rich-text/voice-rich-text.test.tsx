import type { TVoicePortableText } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { VoiceRichText } from './voice-rich-text';

faker.seed(5994);

const MOCK_TOPIC = faker.lorem.word();

const marked: TVoicePortableText = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'Nothing in ', marks: [] },
      { _type: 'span', _key: 's2', text: '{name}', marks: ['strong'] },
      { _type: 'span', _key: 's3', text: ' yet', marks: ['em'] },
      { _type: 'span', _key: 's4', text: ' — browse', marks: ['l1'] },
    ],
    markDefs: [{ _type: 'link', _key: 'l1', href: '/blog' }],
  },
];

const setup = customRender(VoiceRichText, {
  value: marked,
  params: { name: MOCK_TOPIC },
});

describe(`<${VoiceRichText.name}/>`, () => {
  it('renders bold, italic and link marks', () => {
    setup();

    const bold = screen.getByText(MOCK_TOPIC);
    const italic = screen.getByText('yet', { exact: false });
    const link = screen.getByRole('link', { name: '— browse' });

    expect(bold.tagName).toBe('STRONG');
    expect(italic.tagName).toBe('EM');
    expect(link).toHaveAttribute('href', '/blog');
  });

  it('fills a placeholder in plain text and leaves an unknown one as typed', () => {
    setup({ value: 'No posts in {name} for {year}' });

    const text = screen.getByText(`No posts in ${MOCK_TOPIC} for {year}`);

    expect(text).toBeVisible();
  });

  it('renders every paragraph of a multi-paragraph value', () => {
    setup({
      value: [
        {
          _type: 'block',
          _key: 'a',
          style: 'normal',
          children: [{ _type: 'span', _key: 'a1', text: 'First' }],
        },
        {
          _type: 'block',
          _key: 'b',
          style: 'normal',
          children: [{ _type: 'span', _key: 'b1', text: 'Second' }],
        },
      ],
    });

    const first = screen.getByText('First');
    const second = screen.getByText('Second');

    expect(first).toBeVisible();
    expect(second).toBeVisible();
  });
});
