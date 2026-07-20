import type { RichText } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react';

import { PortableTextRenderer } from './portable-text-renderer';

const body: RichText = [
  {
    _type: 'block',
    _key: 'intro',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'intro-span',
        text: 'This story renders several sibling blocks back to back, so any missing vertical rhythm between them is immediately visible.',
      },
    ],
  },
  {
    _type: 'block',
    _key: 'heading-1',
    style: 'h2',
    children: [
      { _type: 'span', _key: 'heading-1-span', text: 'A section heading' },
    ],
  },
  {
    _type: 'block',
    _key: 'paragraph-1',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'paragraph-1-span',
        text: 'A paragraph with ',
      },
      {
        _type: 'span',
        _key: 'paragraph-1-strong',
        text: 'bold',
        marks: ['strong'],
      },
      { _type: 'span', _key: 'paragraph-1-mid', text: ', ' },
      {
        _type: 'span',
        _key: 'paragraph-1-em',
        text: 'italic',
        marks: ['em'],
      },
      { _type: 'span', _key: 'paragraph-1-mid-2', text: ', and ' },
      {
        _type: 'span',
        _key: 'paragraph-1-code',
        text: 'inline code',
        marks: ['code'],
      },
      { _type: 'span', _key: 'paragraph-1-end', text: ' marks.' },
    ],
  },
  {
    _type: 'block',
    _key: 'paragraph-2',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'link-1', href: 'https://example.com' }],
    children: [
      {
        _type: 'span',
        _key: 'paragraph-2-span',
        text: 'A second paragraph with a ',
      },
      {
        _type: 'span',
        _key: 'paragraph-2-link',
        text: 'link',
        marks: ['link-1'],
      },
      { _type: 'span', _key: 'paragraph-2-end', text: ' in it.' },
    ],
  },
  {
    _type: 'code',
    _key: 'code-1',
    language: 'typescript',
    filename: 'example.ts',
    code: 'export const greet = (name: string) => `Hello, ${name}!`;',
  },
  {
    _type: 'block',
    _key: 'paragraph-3',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'paragraph-3-span',
        text: 'A closing paragraph after the code block.',
      },
    ],
  },
];

const meta = {
  title: 'Components/PortableTextRenderer',
  component: PortableTextRenderer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { value: body },
} satisfies Meta<typeof PortableTextRenderer>;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * Multiple sibling block types back to back (heading, paragraphs, marks, a
 * code block) — the layout regression this covers is missing vertical
 * spacing between them, which would render as one unbroken block of text.
 */
export const Content: TStory = {};
