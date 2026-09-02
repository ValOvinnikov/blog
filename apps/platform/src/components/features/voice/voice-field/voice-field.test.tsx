import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VoiceField } from './voice-field';

describe(VoiceField, () => {
  it('shows the inherited value as a placeholder, not as the field value', () => {
    render(
      <VoiceField
        fieldKey="terminalPromptHost"
        label="Terminal Prompt Host"
        value=""
        onChange={vi.fn()}
        placeholder="~$"
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Terminal Prompt Host',
    });
    expect(input).toHaveAttribute('placeholder', '~$');
    expect(input).toHaveValue('');
  });

  it('renders a Textarea for multiline fields and a single-line input otherwise', () => {
    const { rerender } = render(
      <VoiceField
        fieldKey="notFoundDescription"
        label="Not Found Description"
        value=""
        onChange={vi.fn()}
        isMultiline={true}
      />,
    );
    expect(
      screen.getByRole('textbox', { name: 'Not Found Description' }).tagName,
    ).toBe('TEXTAREA');

    rerender(
      <VoiceField
        fieldKey="terminalPromptHost"
        label="Terminal Prompt Host"
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }).tagName,
    ).toBe('INPUT');
  });

  it('makes the field read-only, not disabled, when isReadOnly is true', () => {
    render(
      <VoiceField
        fieldKey="terminalPromptHost"
        label="Terminal Prompt Host"
        value="custom"
        onChange={vi.fn()}
        isReadOnly={true}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Terminal Prompt Host' });
    expect(input).toHaveAttribute('readonly');
    expect(input).toBeEnabled();
  });

  it('reports every keystroke, including clearing back to empty, via onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VoiceField
        fieldKey="terminalPromptHost"
        label="Terminal Prompt Host"
        value="custom"
        onChange={onChange}
        placeholder="~$"
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Terminal Prompt Host',
    });
    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
