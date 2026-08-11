import { ICONS } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignupFull } from './newsletter-signup-full';

faker.seed(123);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: 'idle' as const,
  heading: faker.lorem.sentence(3),
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
};

const setup = customRender(NewsletterSignupFull, baseArgs);

describe(`<${NewsletterSignupFull.name}/>`, () => {
  it('renders the heading and supportingText by default', () => {
    const heading = faker.lorem.sentence(3);
    const supportingText = faker.lorem.sentence(8);
    setup({ heading, supportingText });

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    expect(screen.getByText(supportingText)).toBeVisible();
  });

  it('assigns headingId to the heading element when provided', () => {
    const heading = faker.lorem.sentence(3);
    setup({ heading, headingId: 'newsletter-full-heading' });

    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute(
      'id',
      'newsletter-full-heading',
    );
  });

  it('renders the heading with no id when headingId is omitted', () => {
    const heading = faker.lorem.sentence(3);
    setup({ heading });

    expect(screen.getByRole('heading', { name: heading })).not.toHaveAttribute(
      'id',
    );
  });

  it('renders a labeled email field and submit button', () => {
    setup();

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('associates the email field with its accessible label', () => {
    setup();

    expect(screen.getByLabelText('Email address')).toHaveAttribute(
      'type',
      'email',
    );
  });

  it('renders the chevron icon as the email field prompt', () => {
    setup();
    expect(screen.getByTestId('newsletter-signup-input-prompt')).toBeVisible();
  });

  it('renders trust cues when provided', () => {
    const trustCues = [
      {
        icon: <Icon name={ICONS.SHIELD_CHECK} />,
        label: 'No spam',
      },
      {
        icon: <Icon name={ICONS.X} />,
        label: 'Unsubscribe in one line',
      },
    ];
    setup({ trustCues });

    expect(screen.getByText('No spam')).toBeVisible();
    expect(screen.getByText('Unsubscribe in one line')).toBeVisible();
  });

  it('renders no trust-cue row when trustCues is omitted', () => {
    setup();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('calls onChange with the new value and does not manage its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onSubmit when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    setup({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when Enter is pressed in the field', async () => {
    const onSubmit = vi.fn();
    setup({ onSubmit, email: faker.internet.email() });

    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the field and button and marks the button busy while submitting', () => {
    setup({ status: 'submitting' });

    expect(screen.getByRole('textbox')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the Spinner atom inside the button while submitting', () => {
    setup({ status: 'submitting' });

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(screen.getByTestId('newsletter-signup-spinner')).toBeInTheDocument();
    expect(button).toContainElement(
      screen.getByTestId('newsletter-signup-spinner'),
    );
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setup({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not render an error when status is not error', () => {
    setup({ errorMessage: 'ignored while idle' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-full' });
    expect(screen.getByTestId('newsletter-signup-full')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    const { container } = setup({ className: 'mt-8' });
    expect(container.firstChild).toHaveClass('mt-8');
  });
});
