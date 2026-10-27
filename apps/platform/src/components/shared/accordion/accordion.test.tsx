import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { Accordion } from './accordion';

faker.seed(5995);

const ARIA_EXPANDED = 'aria-expanded';
const FIRST = 'first';
const SECOND = 'second';
const MOCK_FIRST_ROW = faker.lorem.words(2);
const MOCK_FIRST_BODY = faker.lorem.sentence();
const MOCK_SECOND_ROW = faker.lorem.words(3);
const MOCK_SECOND_BODY = faker.lorem.sentence();
const MOCK_NOTE = faker.lorem.sentence();

type TRowValue = typeof FIRST | typeof SECOND;

const ControlledAccordion = ({
  initialValue,
}: {
  initialValue?: TRowValue;
}) => {
  const [openValue, setOpenValue] = useState(initialValue);
  return (
    <Accordion openValue={openValue} onOpenValueChange={setOpenValue}>
      <Accordion.Item value={FIRST}>
        <Accordion.Trigger>{MOCK_FIRST_ROW}</Accordion.Trigger>
        <Accordion.Panel>{MOCK_FIRST_BODY}</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value={SECOND}>
        <Accordion.Trigger>{MOCK_SECOND_ROW}</Accordion.Trigger>
        <Accordion.Panel>{MOCK_SECOND_BODY}</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

const setup = customRender(ControlledAccordion, {});

describe(`<${Accordion.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the first row open', () => {
    let firstTrigger: HTMLElement;
    let secondTrigger: HTMLElement;

    beforeEach(() => {
      setup({ initialValue: FIRST });
      firstTrigger = screen.getByRole('button', { name: MOCK_FIRST_ROW });
      secondTrigger = screen.getByRole('button', { name: MOCK_SECOND_ROW });
    });

    it('reports the open row through aria-expanded', () => {
      const firstBody = screen.getByText(MOCK_FIRST_BODY);

      expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(firstBody).toBeVisible();
    });

    it('closes the open row when another one opens', async () => {
      await user.click(secondTrigger);

      const secondBody = screen.getByText(MOCK_SECOND_BODY);

      expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(secondBody).toBeVisible();
    });

    it('closes the open row from its own header', async () => {
      await user.click(firstTrigger);

      expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });
  });

  it('opens a row with the keyboard', async () => {
    setup();

    await user.tab();
    await user.keyboard('{Enter}');

    const firstTrigger = screen.getByRole('button', { name: MOCK_FIRST_ROW });

    expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
  });

  it('renders a row header before its body whatever order they are written in', () => {
    renderWithIntl(
      <Accordion openValue={FIRST} onOpenValueChange={vi.fn()}>
        <Accordion.Item value={FIRST}>
          <Accordion.Panel>{MOCK_FIRST_BODY}</Accordion.Panel>
          <Accordion.Note>{MOCK_NOTE}</Accordion.Note>
          <Accordion.Trigger>{MOCK_FIRST_ROW}</Accordion.Trigger>
        </Accordion.Item>
      </Accordion>,
    );

    const trigger = screen.getByRole('button', { name: MOCK_FIRST_ROW });
    const note = screen.getByText(MOCK_NOTE);
    const body = screen.getByText(MOCK_FIRST_BODY);

    expect(trigger.compareDocumentPosition(note)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(note.compareDocumentPosition(body)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
