import type { PortableText } from '@blog/config';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PortableTextRenderer } from './portable-text-renderer';

const value: PortableText = [
  {
    _type: 'block',
    _key: 'block-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span-1', text: 'Hello world' }],
  },
];

describe('PortableTextRenderer', () => {
  it('renders portable text blocks as semantic HTML', () => {
    render(<PortableTextRenderer value={value} />);

    expect(screen.getByText('Hello world')).toBeVisible();
  });
});
