import { voiceFieldInputId } from '@platform/utils/voice-fields/voice-fields';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VoiceField } from './voice-field';

describe(VoiceField, () => {
  it('shows the inherited value as a placeholder, not as the field value, and exposes the shared input id', () => {
    render(
      <VoiceField
        fieldKey="terminalPromptHost"
        value=""
        onChange={vi.fn()}
        placeholder="~$"
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute(
      'id',
      voiceFieldInputId('terminalPromptHost'),
    );
    expect(input).toHaveAttribute('placeholder', '~$');
    expect(input).toHaveValue('');
  });

  it('renders a Textarea for multiline fields and a single-line input otherwise', () => {
    const { rerender } = render(
      <VoiceField
        fieldKey="notFoundDescription"
        value=""
        onChange={vi.fn()}
        isMultiline={true}
      />,
    );
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');

    rerender(
      <VoiceField fieldKey="terminalPromptHost" value="" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('textbox').tagName).toBe('INPUT');
  });

  it('reports every keystroke, including clearing back to empty, via onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VoiceField
        fieldKey="terminalPromptHost"
        value="custom"
        onChange={onChange}
        placeholder="~$"
      />,
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
