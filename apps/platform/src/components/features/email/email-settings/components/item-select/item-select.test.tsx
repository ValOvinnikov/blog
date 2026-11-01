import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { pickNextOptionByKeyboard } from '@platform/testing/pick-next-option-by-keyboard';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ItemSelect } from './item-select';

faker.seed(5993);

const MOCK_LABEL = faker.lorem.word();
const ARIA_SELECTED = 'aria-selected';

const MOCK_SENDER_OPTION = {
  value: EMAIL_SENDER_ITEM,
  label: faker.lorem.words(2),
  group: undefined,
  description: faker.lorem.sentence(),
  status: 'default' as const,
  statusLabel: faker.lorem.word(),
};

const MOCK_TEMPLATE_OPTION = {
  value: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  label: faker.lorem.words(2),
  group: faker.lorem.word(),
  description: faker.lorem.sentence(),
  status: 'unsaved' as const,
  statusLabel: faker.lorem.word(),
};

const optionName = ({
  label,
  description,
  statusLabel,
}: typeof MOCK_SENDER_OPTION | typeof MOCK_TEMPLATE_OPTION) =>
  `${label} ${description}${statusLabel}`;

const onSelect = vi.fn();

const setup = customRender(ItemSelect, {
  items: [MOCK_SENDER_OPTION, MOCK_TEMPLATE_OPTION],
  selected: EMAIL_SENDER_ITEM,
  onSelect,
  label: MOCK_LABEL,
});

describe(`<${ItemSelect.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it.each([
    {
      selected: MOCK_SENDER_OPTION.value,
      text: `${MOCK_SENDER_OPTION.label}${MOCK_SENDER_OPTION.statusLabel}`,
    },
    {
      selected: MOCK_TEMPLATE_OPTION.value,
      text: `${MOCK_TEMPLATE_OPTION.label}${MOCK_TEMPLATE_OPTION.group} · ${MOCK_TEMPLATE_OPTION.statusLabel}`,
    },
  ])(
    'shows the selected $selected item and its status in the trigger',
    ({ selected, text }) => {
      setup({ selected });

      const trigger = screen.getByRole('combobox', { name: MOCK_LABEL });

      expect(trigger).toHaveTextContent(text);
    },
  );

  describe('with the sender selected', () => {
    let trigger: HTMLElement;

    beforeEach(() => {
      setup();
      trigger = screen.getByRole('combobox', { name: MOCK_LABEL });
    });

    it('lists every item with its description and status, marking the selected', async () => {
      await user.click(trigger);

      const senderOption = await screen.findByRole('option', {
        name: optionName(MOCK_SENDER_OPTION),
      });
      const templateOption = screen.getByRole('option', {
        name: optionName(MOCK_TEMPLATE_OPTION),
      });

      expect(senderOption).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(templateOption).toHaveAttribute(ARIA_SELECTED, 'false');
    });

    it('selects an item by pointer', async () => {
      await user.click(trigger);
      const templateOption = await screen.findByRole('option', {
        name: optionName(MOCK_TEMPLATE_OPTION),
      });
      await user.click(templateOption);

      expect(onSelect).toHaveBeenCalledWith(MOCK_TEMPLATE_OPTION.value);
    });

    it('selects an item with the arrow keys and Enter', async () => {
      await pickNextOptionByKeyboard(user, optionName(MOCK_TEMPLATE_OPTION));

      expect(onSelect).toHaveBeenCalledWith(MOCK_TEMPLATE_OPTION.value);
    });

    it('closes on Escape without changing the selection', async () => {
      await user.click(trigger);
      await screen.findByRole('listbox');
      await user.keyboard('{Escape}');

      const listbox = screen.queryByRole('listbox');

      expect(listbox).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
