import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { PortableTextEditor } from './portable-text-editor';

const render = renderWithIntl;

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
});
