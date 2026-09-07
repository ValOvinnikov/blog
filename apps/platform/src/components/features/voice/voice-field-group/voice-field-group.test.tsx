import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { VoiceFieldGroup } from './voice-field-group';

const render = renderWithIntl;

const fields = [
  { key: 'notFoundHeading' as const, label: 'Not Found Heading' },
  {
    key: 'notFoundSupportingText' as const,
    label: 'Not Found Supporting Text',
  },
];

describe(VoiceFieldGroup, () => {
  it('renders the group title, field count, and every field label', () => {
    render(
      <VoiceFieldGroup
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByText('404 page')).toBeVisible();
    expect(screen.getByText('2 fields')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Not Found Supporting Text' }),
    ).toBeVisible();
  });

  it('keeps the group title as the only heading, associating each field label with its control instead', () => {
    render(
      <VoiceFieldGroup
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '404 page' }),
    ).toBeVisible();
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    const headingInput = screen.getByRole('textbox', {
      name: 'Not Found Heading',
    });
    const headingLabel = screen.getByText('Not Found Heading', {
      selector: 'label',
      exact: false,
    });
    expect(headingLabel).toHaveAttribute('for', headingInput.id);

    const supportingInput = screen.getByRole('textbox', {
      name: 'Not Found Supporting Text',
    });
    const supportingLabel = screen.getByText('Not Found Supporting Text', {
      selector: 'label',
      exact: false,
    });
    expect(supportingLabel).toHaveAttribute('for', supportingInput.id);
  });

  it('focuses a field input when its visible label is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VoiceFieldGroup
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    const label = screen.getByText('Not Found Heading', {
      selector: 'label',
      exact: false,
    });
    await user.click(label);

    expect(
      screen.getByRole('textbox', { name: 'Not Found Heading' }),
    ).toHaveFocus();
  });

  it('shows each field storage key next to its label', () => {
    render(
      <VoiceFieldGroup
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
        placeholders={{}}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByText('notFoundHeading')).toBeVisible();
    expect(screen.getByText('notFoundSupportingText')).toBeVisible();
  });

  it('makes every field read-only, not disabled, when isReadOnly is true', () => {
    render(
      <VoiceFieldGroup
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
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
        title="404 page"
        fields={fields}
        values={{ notFoundHeading: '', notFoundSupportingText: '' } as never}
        placeholders={{}}
        onFieldChange={onFieldChange}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Not Found Heading' });
    await user.type(input, 'x');

    expect(onFieldChange).toHaveBeenCalledWith('notFoundHeading', 'x');
  });
});
