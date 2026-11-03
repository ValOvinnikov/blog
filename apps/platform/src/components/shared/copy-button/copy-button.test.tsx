import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { CopyButton } from './copy-button';

faker.seed(6608);

const MOCK_VALUE = faker.string.alphanumeric(32);
const MOCK_LABEL = faker.lorem.words(3);

const setup = customRender(CopyButton, {
  value: MOCK_VALUE,
  ariaLabel: MOCK_LABEL,
});

describe(`<${CopyButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('is named for what it copies', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  it('puts exactly its value on the clipboard', async () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);
    const clipboard = await navigator.clipboard.readText();

    expect(clipboard).toBe(MOCK_VALUE);
  });

  it('announces the copy to screen readers', async () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);
    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent('Copied');
  });

  it('keeps its name after copying', async () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);
    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent('Copied');
    expect(button).toHaveAccessibleName(MOCK_LABEL);
  });

  it('tells the user to select the text when the clipboard refuses', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    );
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);
    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent("Couldn't copy. Select the text instead.");
  });
});
