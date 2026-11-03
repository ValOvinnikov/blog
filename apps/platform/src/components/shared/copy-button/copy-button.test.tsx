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
  let button: HTMLElement;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
    button = screen.getByRole('button', { name: MOCK_LABEL });
  });

  it('is named for what it copies', () => {
    expect(button).toBeVisible();
  });

  describe('once clicked', () => {
    beforeEach(async () => {
      await user.click(button);
    });

    it('puts exactly its value on the clipboard', async () => {
      const clipboard = await navigator.clipboard.readText();

      expect(clipboard).toBe(MOCK_VALUE);
    });

    it('announces the copy and keeps its name', async () => {
      const status = await screen.findByRole('status');

      expect(status).toHaveTextContent('Copied');
      expect(button).toHaveAccessibleName(MOCK_LABEL);
    });
  });

  it('tells the user to select the text when the clipboard refuses', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    );

    await user.click(button);
    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent("Couldn't copy. Select the text instead.");
  });
});
