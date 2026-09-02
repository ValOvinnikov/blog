import { renderWithIntl, screen } from '@platform/testing/custom-render';
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

  it('keeps the group title as the only heading, associating each field label with its control instead', () => {
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

    expect(
      screen.getByRole('heading', { level: 2, name: 'Terminal prompts' }),
    ).toBeVisible();
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    const hostInput = screen.getByRole('textbox', {
      name: 'Terminal Prompt Host',
    });
    const hostLabel = screen.getByText('Terminal Prompt Host', {
      selector: 'label',
      exact: false,
    });
    expect(hostLabel).toHaveAttribute('for', hostInput.id);

    const signInInput = screen.getByRole('textbox', {
      name: 'Auth Prompt Command — Sign In',
    });
    const signInLabel = screen.getByText('Auth Prompt Command — Sign In', {
      selector: 'label',
      exact: false,
    });
    expect(signInLabel).toHaveAttribute('for', signInInput.id);
  });

  it('focuses a field input when its visible label is clicked', async () => {
    const user = userEvent.setup();
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

    const label = screen.getByText('Terminal Prompt Host', {
      selector: 'label',
      exact: false,
    });
    await user.click(label);

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveFocus();
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

  it('makes every field read-only, not disabled, when isReadOnly is true', () => {
    render(
      <VoiceFieldGroup
        title="Terminal prompts"
        fields={fields}
        values={
          { terminalPromptHost: '', authPromptCommandSignIn: '' } as never
        }
        placeholders={{}}
        onFieldChange={vi.fn()}
        isReadOnly={true}
      />,
    );

    for (const field of screen.getAllByRole('textbox')) {
      expect(field).toHaveAttribute('readonly');
      expect(field).toBeEnabled();
    }
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
