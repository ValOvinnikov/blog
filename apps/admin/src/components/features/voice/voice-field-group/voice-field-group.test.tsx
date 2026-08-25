import { renderWithIntl, screen } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { VoiceFieldGroup } from './voice-field-group';

const render = renderWithIntl;

const fields = [
  { key: 'terminalPromptHost' as const, label: 'Terminal Prompt Host' },
  {
    key: 'authPromptCommandSignIn' as const,
    label: 'Auth Prompt Command — Sign In',
  },
];

describe(VoiceFieldGroup, () => {
  it('renders the group title, field count, and every field label', () => {
    render(
      <VoiceFieldGroup
        title="Terminal prompts"
        fields={fields}
        values={
          { terminalPromptHost: '', authPromptCommandSignIn: '' } as never
        }
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Terminal prompts')).toBeVisible();
    expect(screen.getByText('2 fields')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Auth Prompt Command — Sign In' }),
    ).toBeVisible();
  });

  it('shows each field storage key next to its label', () => {
    render(
      <VoiceFieldGroup
        title="Terminal prompts"
        fields={fields}
        values={
          { terminalPromptHost: '', authPromptCommandSignIn: '' } as never
        }
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByText('terminalPromptHost')).toBeVisible();
    expect(screen.getByText('authPromptCommandSignIn')).toBeVisible();
  });

  it('forwards a field change with its own key', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(
      <VoiceFieldGroup
        title="Terminal prompts"
        fields={fields}
        values={
          { terminalPromptHost: '', authPromptCommandSignIn: '' } as never
        }
        placeholders={{}}
        onFieldChange={onFieldChange}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Terminal Prompt Host' });
    await user.type(input, 'x');

    expect(onFieldChange).toHaveBeenCalledWith('terminalPromptHost', 'x');
  });
});
