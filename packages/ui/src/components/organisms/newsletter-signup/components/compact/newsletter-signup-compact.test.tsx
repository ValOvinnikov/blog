import { FORM_STATUS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { NewsletterSignupCompact } from './newsletter-signup-compact';

faker.seed(123);

const HEADING = faker.lorem.words(2);
const SUBMIT_LABEL = faker.lorem.word();
const EMAIL_LABEL = faker.lorem.words(2);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: FORM_STATUS.IDLE,
  heading: HEADING,
  prefix: (
    <span data-testid="newsletter-signup-compact-prefix" aria-hidden="true">
      $
    </span>
  ),
  submitLabel: SUBMIT_LABEL,
  emailAriaLabel: EMAIL_LABEL,
};

const setup = customRender(NewsletterSignupCompact, baseArgs);

describe(`<${NewsletterSignupCompact.name}/>`, () => {
  let successMessage: string;

  beforeEach(() => {
    successMessage = faker.lorem.sentence();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders as a slim strip with no heading element', () => {
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.getByText(HEADING)).toBeVisible();
      expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).toBeVisible();
    });

    it('renders the label with no id when headingId is omitted', () => {
      expect(screen.getByText(HEADING)).not.toHaveAttribute('id');
    });

    it('renders the prefix node as-is, ahead of the heading', () => {
      const prefix = screen.getByTestId('newsletter-signup-compact-prefix');
      expect(prefix).toHaveTextContent('$');
      expect(prefix.compareDocumentPosition(screen.getByText(HEADING))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('renders the chevron icon as the email field prompt', () => {
      expect(
        screen.getByTestId('newsletter-signup-input-prompt'),
      ).toBeVisible();
    });
  });

  it('renders the heading prop as the label text', () => {
    const heading = faker.lorem.sentence(3);
    setup({ heading });

    expect(screen.getByText(heading)).toBeVisible();
  });

  it('assigns headingId to the label element when provided', () => {
    setup({ headingId: 'newsletter-compact-heading' });

    expect(screen.getByText(HEADING)).toHaveAttribute(
      'id',
      'newsletter-compact-heading',
    );
  });

  it('renders neither label nor prefix when both are omitted', () => {
    setup({ heading: undefined, prefix: undefined });

    expect(screen.queryByText(HEADING)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('newsletter-signup-compact-prefix'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).toBeVisible();
  });

  it('renders no prefix element when prefix is omitted', () => {
    setup({ prefix: undefined });

    expect(
      screen.queryByTestId('newsletter-signup-compact-prefix'),
    ).not.toBeInTheDocument();
  });

  describe('on success', () => {
    beforeEach(() => {
      setup({ status: FORM_STATUS.SUCCESS, successMessage });
    });

    it('shows the success message and hides the field on success', () => {
      expect(screen.getByRole('status')).toHaveTextContent(successMessage);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('keeps the prefix and heading visible on success', () => {
      expect(
        screen.getByTestId('newsletter-signup-compact-prefix'),
      ).toBeVisible();
      expect(screen.getByText(HEADING)).toBeVisible();
    });
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-compact' });
    expect(screen.getByTestId('newsletter-signup-compact')).toBeVisible();
  });
});
