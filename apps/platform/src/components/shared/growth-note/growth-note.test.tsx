import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CONTROLS, ARIA_EXPANDED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GrowthNote } from './growth-note';

faker.seed(6844);

const { growthNote } = messages;
const MOCK_PLAIN_LABEL = faker.lorem.sentence();
const MOCK_LINK_LABEL = faker.lorem.word();
const MOCK_LINK_DESCRIPTION = faker.lorem.sentence();
const MOCK_LINK_HREF = `#${faker.lorem.word()}`;
const MOCK_CLOSING_LINE = faker.lorem.sentence();
const onSelect = vi.fn();

const setup = customRender(GrowthNote, {
  items: [
    { id: faker.string.alpha(6), label: MOCK_PLAIN_LABEL },
    {
      id: faker.string.alpha(6),
      label: MOCK_LINK_LABEL,
      description: MOCK_LINK_DESCRIPTION,
      link: { href: MOCK_LINK_HREF, onSelect },
    },
  ],
  closingLine: MOCK_CLOSING_LINE,
});

describe(`<${GrowthNote.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onSelect.mockReset();
  });

  it('starts folded with the title and a button to see what is included', () => {
    setup();

    const title = screen.getByText(growthNote.title);
    const button = screen.getByRole('button', { name: growthNote.show });
    const list = screen.queryByRole('list', { name: growthNote.listLabel });

    expect(title).toBeVisible();
    expect(button).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(button).toHaveAttribute(ARIA_CONTROLS);
    expect(list).not.toBeInTheDocument();
  });

  it('opens the list and the closing line, keeping focus on the button', async () => {
    setup();

    const button = screen.getByRole('button', { name: growthNote.show });
    await user.click(button);

    const list = screen.getByRole('list', { name: growthNote.listLabel });
    const closing = screen.getByText(MOCK_CLOSING_LINE);
    const hide = screen.getByRole('button', { name: growthNote.hide });

    expect(list).toBeVisible();
    expect(closing).toBeVisible();
    expect(hide).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(hide).toHaveFocus();
  });

  it('folds the panel again from Hide, keeping focus on the button', async () => {
    setup();

    const showButton = screen.getByRole('button', { name: growthNote.show });
    await user.click(showButton);
    const hideButton = screen.getByRole('button', { name: growthNote.hide });
    await user.click(hideButton);

    const show = screen.getByRole('button', { name: growthNote.show });
    const list = screen.queryByRole('list', { name: growthNote.listLabel });
    const closing = screen.getByText(MOCK_CLOSING_LINE);

    expect(show).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(show).toHaveFocus();
    expect(list).not.toBeInTheDocument();
    expect(closing).not.toBeVisible();
  });

  it('lists a plain item without a link and a link item with its description', async () => {
    setup();

    const showButton = screen.getByRole('button', { name: growthNote.show });
    await user.click(showButton);

    const plain = screen.getByText(MOCK_PLAIN_LABEL);
    const description = screen.getByText(MOCK_LINK_DESCRIPTION);
    const links = screen.getAllByRole('link');

    expect(plain).toBeVisible();
    expect(description).toBeVisible();
    expect(links).toHaveLength(1);
  });

  it('hands a clicked link item to its handler without navigating', async () => {
    setup();

    const showButton = screen.getByRole('button', { name: growthNote.show });
    await user.click(showButton);
    const link = screen.getByRole('link', {
      name: new RegExp(MOCK_LINK_LABEL),
    });
    await user.click(link);

    expect(onSelect).toHaveBeenCalledOnce();
  });
});
