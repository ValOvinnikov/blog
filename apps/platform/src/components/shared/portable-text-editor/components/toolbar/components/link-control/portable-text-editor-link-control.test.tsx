import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { PortableTextEditorLinkControl } from './portable-text-editor-link-control';

const renderControl = (onApply = vi.fn()) =>
  renderWithIntl(
    <PortableTextEditorLinkControl
      id="link-control"
      initialHref=""
      hasExistingLink={false}
      onApply={onApply}
      onRemove={vi.fn()}
      onCancel={vi.fn()}
    />,
  );

describe(PortableTextEditorLinkControl, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('applies a trimmed URL on submit', async () => {
    const onApply = vi.fn();
    renderControl(onApply);

    await user.type(
      screen.getByRole('textbox', { name: 'Link URL' }),
      ' https://example.com ',
    );
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith('https://example.com');
  });

  it('keeps focus on an invalid URL, marks it invalid and does not apply it', async () => {
    const onApply = vi.fn();
    renderControl(onApply);
    const input = screen.getByRole('textbox', { name: 'Link URL' });

    await user.type(input, 'not a url');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
