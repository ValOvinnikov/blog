import { faker } from '@faker-js/faker';
import { KEY } from '@platform/constants/keyboard';
import { customRender, screen } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Dialog } from './dialog';

faker.seed(5995);

const MOCK_TITLE = faker.lorem.sentence();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_FOOTER_LABEL = faker.lorem.words(2);

const onOpenChangeMock = vi.fn();

const setup = customRender(Dialog, {
  isOpen: true,
  onOpenChange: onOpenChangeMock,
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
  footer: <button type="button">{MOCK_FOOTER_LABEL}</button>,
  children: <p>{MOCK_BODY}</p>,
});

describe(`<${Dialog.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onOpenChangeMock.mockReset();
  });

  it('shows the title, description, body and footer in a named dialog', () => {
    setup();

    const dialog = screen.getByRole('dialog', { name: MOCK_TITLE });
    const body = screen.getByText(MOCK_BODY);
    const footerButton = screen.getByRole('button', {
      name: MOCK_FOOTER_LABEL,
    });

    expect(dialog).toHaveAccessibleDescription(MOCK_DESCRIPTION);
    expect(body).toBeVisible();
    expect(footerButton).toBeVisible();
  });

  it('focuses the first control in its body on open', async () => {
    setup({ children: <input aria-label={MOCK_BODY} /> });

    const field = screen.getByRole('textbox', { name: MOCK_BODY });

    await vi.waitFor(() => expect(field).toHaveFocus());
  });

  it('renders nothing while closed', () => {
    setup({ isOpen: false });

    const dialog = screen.queryByRole('dialog');

    expect(dialog).not.toBeInTheDocument();
  });

  describe.each([
    [KEY.ESCAPE, () => user.keyboard(USER_EVENT_KEY.ESCAPE)],
    ['a backdrop click', () => user.click(document.body)],
  ])('on %s', (_, dismiss) => {
    it('asks to close', async () => {
      setup();

      await dismiss();

      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });

    it('stays open while pending', async () => {
      setup({ isPending: true });

      await dismiss();

      expect(onOpenChangeMock).not.toHaveBeenCalled();
    });
  });
});
