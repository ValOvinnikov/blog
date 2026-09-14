import type { TCtaContent } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';

import { InlineTextRenderer } from './inline-text-renderer';

const value: TCtaContent = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'A paragraph with ' },
      { _type: 'span', _key: 's2', text: 'bold', marks: ['strong'] },
      { _type: 'span', _key: 's3', text: ' and ' },
      { _type: 'span', _key: 's4', text: 'italic', marks: ['em'] },
      { _type: 'span', _key: 's5', text: ' text.' },
    ],
    markDefs: undefined,
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    listItem: 'bullet',
    children: [{ _type: 'span', _key: 's6', text: 'First bullet' }],
    markDefs: undefined,
  },
  {
    _type: 'block',
    _key: 'b3',
    style: 'normal',
    listItem: 'bullet',
    children: [{ _type: 'span', _key: 's7', text: 'Second bullet' }],
    markDefs: undefined,
  },
  {
    _type: 'block',
    _key: 'b4',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's8', text: 'A ', marks: [] },
      { _type: 'span', _key: 's9', text: 'link', marks: ['link-1'] },
      { _type: 'span', _key: 's10', text: ' to elsewhere.', marks: [] },
    ],
    markDefs: [
      {
        _key: 'link-1',
        _type: 'sharedLinkAnnotation',
        link: {
          label: 'link',
          href: 'https://example.com',
          target: undefined,
          platform: undefined,
        },
      },
    ],
  },
];

const setup = customRender(InlineTextRenderer, { value });

describe(`<${InlineTextRenderer.name}/>`, () => {
  it('renders paragraphs with bold and italic marks', () => {
    setup();

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('renders bullet list items inside a ul', () => {
    setup();

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it("routes a sharedLinkAnnotation mark's resolved href through the rendered link", () => {
    setup();

    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('renders a sharedLinkAnnotation mark with no resolved link as plain text, not a broken anchor', () => {
    setup({
      value: [
        {
          _type: 'block',
          _key: 'b5',
          style: 'normal',
          children: [
            { _type: 'span', _key: 's11', text: 'dangling', marks: ['link-2'] },
          ],
          markDefs: [
            { _key: 'link-2', _type: 'sharedLinkAnnotation', link: undefined },
          ],
        },
      ],
    });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('dangling')).toBeVisible();
  });
});
