import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { customRender, screen } from '@platform/testing/custom-render';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import userEvent from '@testing-library/user-event';

import { ItemSelect } from './item-select';

const setup = customRender(ItemSelect, {
  items: [
    {
      value: EMAIL_SENDER_ITEM,
      label: 'Sender',
      group: undefined,
      description: 'Who emails come from',
      status: 'default',
      statusLabel: 'Default',
    },
    {
      value: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      label: 'Sign-in link',
      group: 'Template',
      description: 'The magic link email',
      status: 'unsaved',
      statusLabel: 'Unsaved',
    },
  ],
  selected: EMAIL_SENDER_ITEM,
  onSelect: vi.fn(),
  label: 'Editing',
});

describe(`<${ItemSelect.name}/>`, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('names the trigger after its label and shows the selected item with its status', () => {
    setup();

    expect(screen.getByRole('combobox', { name: 'Editing' })).toHaveTextContent(
      'SenderDefault',
    );
  });

  it('shows the group of a selected template beside its status', () => {
    setup({ selected: EMAIL_TEMPLATE_TYPE.MAGIC_LINK });

    expect(screen.getByRole('combobox', { name: 'Editing' })).toHaveTextContent(
      'Sign-in linkTemplate · Unsaved',
    );
  });

  it('lists every item with its description and status, marking the selected one', async () => {
    setup();

    await user.click(screen.getByRole('combobox', { name: 'Editing' }));

    expect(
      await screen.findByRole('option', {
        name: /^Sender.*Who emails come from.*Default$/,
      }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('option', {
        name: /^Sign-in link.*The magic link email.*Unsaved$/,
      }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('selects an item by pointer', async () => {
    const onSelect = vi.fn();
    setup({ onSelect });

    await user.click(screen.getByRole('combobox', { name: 'Editing' }));
    await user.click(
      await screen.findByRole('option', { name: /^Sign-in link/ }),
    );

    expect(onSelect).toHaveBeenCalledWith(EMAIL_TEMPLATE_TYPE.MAGIC_LINK);
  });

  it('selects an item with the arrow keys and Enter', async () => {
    const onSelect = vi.fn();
    setup({ onSelect });

    screen.getByRole('combobox', { name: 'Editing' }).focus();
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(EMAIL_TEMPLATE_TYPE.MAGIC_LINK);
  });

  it('closes on Escape without changing the selection', async () => {
    const onSelect = vi.fn();
    setup({ onSelect });

    await user.click(screen.getByRole('combobox', { name: 'Editing' }));
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
