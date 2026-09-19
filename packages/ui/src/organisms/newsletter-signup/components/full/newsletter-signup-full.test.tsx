import { ICONS } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

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

  it('shows the success message and hides the field on success', () => {
    const successMessage = faker.lorem.sentence();
    setup({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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
