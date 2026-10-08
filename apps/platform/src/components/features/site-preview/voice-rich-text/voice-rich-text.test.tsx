import type { TVoicePortableText } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { VoiceRichText } from './voice-rich-text';

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

describe(VoiceRichText, () => {
  it('renders bold, italic and link marks', () => {
    render(<VoiceRichText value={marked} params={{ name: 'Design' }} />);

    expect(screen.getByText('Design').tagName).toBe('STRONG');
    expect(screen.getByText('yet', { exact: false }).tagName).toBe('EM');
    expect(screen.getByRole('link', { name: '— browse' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('fills a placeholder in plain text and leaves an unknown one as typed', () => {
    render(
      <p>
        <VoiceRichText
          value="No posts in {name} for {year}"
          params={{ name: 'Design' }}
        />
      </p>,
    );

    expect(screen.getByText('No posts in Design for {year}')).toBeVisible();
  });

  it('renders every paragraph of a multi-paragraph value', () => {
    render(
      <p>
        <VoiceRichText
          value={[
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
          ]}
        />
      </p>,
    );

    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('Second')).toBeVisible();
  });
});
