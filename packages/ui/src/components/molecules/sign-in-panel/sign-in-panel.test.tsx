import { FORM_STATUS, ICONS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { SignInPanel } from './sign-in-panel';

faker.seed(123);

const MOCK_LABELS = {
  title: faker.lorem.words(2),
  or: faker.lorem.word(),
  email: faker.lorem.words(2),
  emailPlaceholder: faker.internet.email(),
  submit: faker.lorem.words(4),
  sending: faker.lorem.word(),
  hint: faker.lorem.sentence(),
  sentTitle: faker.lorem.words(3),
  sentMessage: faker.lorem.sentence(),
  useDifferentEmail: faker.lorem.words(3),
};
const MOCK_GITHUB = {
  id: faker.string.uuid(),
  icon: ICONS.GITHUB,
  label: faker.lorem.words(3),
  pendingLabel: faker.lorem.words(4),
};
const MOCK_GOOGLE = {
  id: faker.string.uuid(),
  icon: ICONS.GOOGLE,
  label: faker.lorem.words(3),
  pendingLabel: faker.lorem.words(4),
};
const ARIA_DISABLED = 'aria-disabled';
const MOCK_EMAIL = faker.internet.email();
const MOCK_ERROR = faker.lorem.sentence();

const mockEmailForm = (overrides = {}) => ({
  value: MOCK_EMAIL,
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  status: FORM_STATUS.IDLE,
  ...overrides,
});

const mockProviders = () => [
  { ...MOCK_GITHUB, onSelect: vi.fn() },
  { ...MOCK_GOOGLE, onSelect: vi.fn() },
];

const setup = customRender(SignInPanel, {
  panel: { id: faker.string.uuid(), isOpen: true },
  labels: MOCK_LABELS,
  providers: mockProviders(),
  emailForm: mockEmailForm(),
});

describe(`<${SignInPanel.name}/>`, () => {
  let providers: ReturnType<typeof mockProviders>;
  let emailForm: ReturnType<typeof mockEmailForm>;

  beforeEach(() => {
    providers = mockProviders();
    emailForm = mockEmailForm();
    setup({ providers, emailForm });
  });

  it('is a dialog named by its title', () => {
    const dialog = screen.getByRole('dialog', { name: MOCK_LABELS.title });

    expect(dialog).toBeVisible();
  });

  it('shows every provider and the email field at once', () => {
    const github = screen.getByRole('button', { name: MOCK_GITHUB.label });
    const google = screen.getByRole('button', { name: MOCK_GOOGLE.label });
    const email = screen.getByRole('textbox', { name: MOCK_LABELS.email });

    expect(github).toBeVisible();
    expect(google).toBeVisible();
    expect(email).toBeVisible();
  });

  it('continues with the provider the reader picks', async () => {
    await userEvent.click(
      screen.getByRole('button', { name: MOCK_GOOGLE.label }),
    );

    expect(providers[1]?.onSelect).toHaveBeenCalledOnce();
  });

  it('sends the link when the form is submitted', async () => {
    await userEvent.click(
      screen.getByRole('button', { name: MOCK_LABELS.submit }),
    );

    expect(emailForm.onSubmit).toHaveBeenCalledOnce();
  });

  it('passes each keystroke in the email field to onChange', async () => {
    await userEvent.type(
      screen.getByRole('textbox', { name: MOCK_LABELS.email }),
      'a',
    );

    expect(emailForm.onChange).toHaveBeenCalledWith(`${MOCK_EMAIL}a`);
  });
});

describe(`<${SignInPanel.name}/> without providers`, () => {
  it('hides the email divider', () => {
    setup({ providers: [] });

    const divider = screen.queryByText(MOCK_LABELS.or);

    expect(divider).not.toBeInTheDocument();
  });
});

describe(`<${SignInPanel.name}/> after a provider is pressed`, () => {
  let providers: ReturnType<typeof mockProviders>;

  beforeEach(() => {
    providers = mockProviders();
    setup({ providers, pendingProviderId: MOCK_GITHUB.id });
  });

  it('says where the pressed row is taking the reader', () => {
    const pressed = screen.getByRole('button', {
      name: MOCK_GITHUB.pendingLabel,
    });

    expect(pressed).toHaveAttribute('aria-busy', 'true');
  });

  it('holds the other rows until the redirect', async () => {
    const google = screen.getByRole('button', { name: MOCK_GOOGLE.label });

    await userEvent.click(google);

    expect(google).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(providers[1]?.onSelect).not.toHaveBeenCalled();
  });
});

describe(`<${SignInPanel.name}/> while the link is sending`, () => {
  let emailForm: ReturnType<typeof mockEmailForm>;

  beforeEach(() => {
    emailForm = mockEmailForm({ status: FORM_STATUS.SUBMITTING });
    setup({ emailForm });
  });

  it('marks the send button busy and names it for sending', () => {
    const submit = screen.getByRole('button', { name: MOCK_LABELS.sending });

    expect(submit).toHaveAttribute('aria-busy', 'true');
  });

  it('does not send a second time', async () => {
    await userEvent.click(
      screen.getByRole('button', { name: MOCK_LABELS.sending }),
    );

    expect(emailForm.onSubmit).not.toHaveBeenCalled();
  });

  it('locks the email field and the providers', () => {
    const email = screen.getByRole('textbox', { name: MOCK_LABELS.email });
    const github = screen.getByRole('button', { name: MOCK_GITHUB.label });

    expect(email).toBeDisabled();
    expect(github).toHaveAttribute(ARIA_DISABLED, 'true');
  });
});

describe(`<${SignInPanel.name}/> once the link is sent`, () => {
  let emailForm: ReturnType<typeof mockEmailForm>;

  beforeEach(() => {
    emailForm = mockEmailForm({ status: FORM_STATUS.SUCCESS });
    setup({ emailForm });
  });

  it('replaces the form with where the link went', () => {
    const dialog = screen.getByRole('dialog', { name: MOCK_LABELS.sentTitle });
    const status = screen.getByRole('status');
    const email = screen.queryByRole('textbox');

    expect(dialog).toBeVisible();
    expect(status).toHaveTextContent(MOCK_LABELS.sentMessage);
    expect(email).not.toBeInTheDocument();
  });

  it('starts over with a different email', async () => {
    await userEvent.click(
      screen.getByRole('button', { name: MOCK_LABELS.useDifferentEmail }),
    );

    expect(emailForm.onReset).toHaveBeenCalledOnce();
  });
});

describe(`<${SignInPanel.name}/> when the link could not be sent`, () => {
  beforeEach(() => {
    setup({
      emailForm: mockEmailForm({
        status: FORM_STATUS.ERROR,
        errorMessage: MOCK_ERROR,
      }),
    });
  });

  it('shows the error under the field and ties it to the field', () => {
    const alert = screen.getByRole('alert');
    const email = screen.getByRole('textbox', { name: MOCK_LABELS.email });

    expect(alert).toHaveTextContent(MOCK_ERROR);
    expect(email).toHaveAccessibleDescription(MOCK_ERROR);
  });
});
