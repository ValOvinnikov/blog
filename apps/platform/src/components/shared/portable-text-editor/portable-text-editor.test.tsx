import type { TPortableTextBlock } from '@blog/db/schema/email-templates';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';

import { PortableTextEditor } from './portable-text-editor';

const render = renderWithIntl;

const linkBody = (href: string): TPortableTextBlock[] => [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'click me', marks: ['link1'] },
    ],
    markDefs: [{ _key: 'link1', _type: 'link', href }],
  },
];

describe(PortableTextEditor, () => {
  it('mounts with an accessible name and no starting content', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Body' })).toBeInTheDocument();
  });

  it('shows a formatting toolbar when not disabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('hides the formatting toolbar when disabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
        isDisabled={true}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Bold' }),
    ).not.toBeInTheDocument();
  });

  it('renders an authored link with a safe href as a real, working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('https://example.com')}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'click me' })).toHaveAttribute(
        'href',
        'https://example.com/',
      );
    });
  });

  it('strips a javascript: href instead of rendering it as a working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('javascript:alert(1)')}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeInTheDocument();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('strips a data: href instead of rendering it as a working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('data:text/html,<script>alert(1)</script>')}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeInTheDocument();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('strips a case- and whitespace-obfuscated javascript: href', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('  JaVaScRiPt:alert(1)')}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeInTheDocument();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
