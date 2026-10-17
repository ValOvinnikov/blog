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
      const headingElement = screen.queryByRole('heading');
      const label = screen.getByText(HEADING);
      const emailField = screen.getByRole('textbox', { name: EMAIL_LABEL });

      expect(headingElement).not.toBeInTheDocument();
      expect(label).toBeVisible();
      expect(emailField).toBeVisible();
    });

    it('renders the label with no id when headingId is omitted', () => {
      const label = screen.getByText(HEADING);

      expect(label).not.toHaveAttribute('id');
    });

    it('renders the prefix node as-is, ahead of the heading', () => {
      const prefix = screen.getByTestId('newsletter-signup-compact-prefix');
      const label = screen.getByText(HEADING);

      expect(prefix).toHaveTextContent('$');
      expect(prefix.compareDocumentPosition(label)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('renders the chevron icon as the email field prompt', () => {
      const prompt = screen.getByTestId('newsletter-signup-input-prompt');

      expect(prompt).toBeVisible();
    });
  });

  it('renders the heading prop as the label text', () => {
    const heading = faker.lorem.sentence(3);
    setup({ heading });

    const label = screen.getByText(heading);

    expect(label).toBeVisible();
  });

  it('assigns headingId to the label element when provided', () => {
    setup({ headingId: 'newsletter-compact-heading' });

    const label = screen.getByText(HEADING);

    expect(label).toHaveAttribute('id', 'newsletter-compact-heading');
  });

  it('renders neither label nor prefix when both are omitted', () => {
    setup({ heading: undefined, prefix: undefined });

    const label = screen.queryByText(HEADING);
    const prefix = screen.queryByTestId('newsletter-signup-compact-prefix');
    const emailField = screen.getByRole('textbox', { name: EMAIL_LABEL });

    expect(label).not.toBeInTheDocument();
    expect(prefix).not.toBeInTheDocument();
    expect(emailField).toBeVisible();
  });

  it('renders no prefix element when prefix is omitted', () => {
    setup({ prefix: undefined });

    const prefix = screen.queryByTestId('newsletter-signup-compact-prefix');

    expect(prefix).not.toBeInTheDocument();
  });

  describe('on success', () => {
    beforeEach(() => {
      setup({ status: FORM_STATUS.SUCCESS, successMessage });
    });

    it('shows the success message and hides the field on success', () => {
      const status = screen.getByRole('status');
      const emailField = screen.queryByRole('textbox');

      expect(status).toHaveTextContent(successMessage);
      expect(emailField).not.toBeInTheDocument();
    });

    it('keeps the prefix and heading visible on success', () => {
      const prefix = screen.getByTestId('newsletter-signup-compact-prefix');
      const label = screen.getByText(HEADING);

      expect(prefix).toBeVisible();
      expect(label).toBeVisible();
    });
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-compact' });

    const root = screen.getByTestId('newsletter-signup-compact');

    expect(root).toBeVisible();
  });
});
