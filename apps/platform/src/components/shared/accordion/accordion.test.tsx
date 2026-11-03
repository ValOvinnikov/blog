import { faker } from '@faker-js/faker';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import { KEY } from '@platform/constants/keyboard';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';

import { Accordion } from './accordion';
import type { TAccordionActions } from './use-accordion-actions';

faker.seed(5995);

const ARIA_EXPANDED = 'aria-expanded';
const FIRST = 'first';
const SECOND = 'second';
const MOCK_FIRST_ROW = faker.lorem.words(2);
const MOCK_FIRST_BODY = faker.lorem.sentence();
const MOCK_SECOND_ROW = faker.lorem.words(3);
const MOCK_SECOND_BODY = faker.lorem.sentence();
const MOCK_NOTE = faker.lorem.sentence();
const MOCK_SUMMARY = faker.lorem.words(4);
const MOCK_TRAILING = faker.lorem.word();
const SUMMARY_MARK_TEST_ID = 'summary-mark';
const EXPAND_ALL = 'Expand all';
const JUMP_TO_SECOND = 'Jump to second';

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

const RowAccordion = () => {
  const [openValues, setOpenValues] = useState<TRowValue[]>([]);
  const actionsRef = useRef<TAccordionActions<TRowValue>>(null);

  return (
    <>
      <button type="button" onClick={() => setOpenValues([FIRST, SECOND])}>
        {EXPAND_ALL}
      </button>
      <button
        type="button"
        onClick={() => actionsRef.current?.openRow(SECOND, { focus: true })}
      >
        {JUMP_TO_SECOND}
      </button>
      <Accordion
        multiple={true}
        variant={ACCORDION_VARIANT.ROW}
        openValues={openValues}
        onOpenValuesChange={setOpenValues}
        actionsRef={actionsRef}
      >
        <Accordion.Item value={FIRST}>
          <Accordion.Trigger
            summary={MOCK_SUMMARY}
            summaryMark={<span data-testid={SUMMARY_MARK_TEST_ID} />}
            trailing={MOCK_TRAILING}
          >
            {MOCK_FIRST_ROW}
          </Accordion.Trigger>
          <Accordion.Panel>{MOCK_FIRST_BODY}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={SECOND}>
          <Accordion.Trigger>{MOCK_SECOND_ROW}</Accordion.Trigger>
          <Accordion.Panel>{MOCK_SECOND_BODY}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  );
};

const setupRows = customRender(RowAccordion, {});

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

  describe('with every row folded', () => {
    let firstTrigger: HTMLElement;

    beforeEach(() => {
      setup();
      firstTrigger = screen.getByRole('button', { name: MOCK_FIRST_ROW });
    });

    describe('with focus on the first row', () => {
      beforeEach(async () => {
        await user.tab();
      });

      it('opens a row with the keyboard', async () => {
        await user.keyboard('{Enter}');

        expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });

      it('opens a row with the Space key', async () => {
        await user.keyboard(KEY.SPACE);

        expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });
    });

    it('puts each row button inside an h3 by default', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_FIRST_ROW,
      });

      expect(heading).toContainElement(firstTrigger);
    });
  });

  it('puts the row button inside the heading level it is given', () => {
    renderWithIntl(
      <Accordion openValue={undefined} onOpenValueChange={vi.fn()}>
        <Accordion.Item value={FIRST}>
          <Accordion.Trigger headingLevel={4}>
            {MOCK_FIRST_ROW}
          </Accordion.Trigger>
          <Accordion.Panel>{MOCK_FIRST_BODY}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );

    const heading = screen.getByRole('heading', {
      level: 4,
      name: MOCK_FIRST_ROW,
    });
    const trigger = screen.getByRole('button', { name: MOCK_FIRST_ROW });

    expect(heading).toContainElement(trigger);
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

  describe('with several rows open at once', () => {
    let firstTrigger: HTMLElement;
    let secondTrigger: HTMLElement;

    beforeEach(() => {
      setupRows();
      firstTrigger = screen.getByRole('button', {
        name: new RegExp(MOCK_FIRST_ROW),
      });
      secondTrigger = screen.getByRole('button', { name: MOCK_SECOND_ROW });
    });

    describe('with every row expanded by the caller', () => {
      beforeEach(async () => {
        const expandAll = screen.getByRole('button', { name: EXPAND_ALL });
        await user.click(expandAll);
      });

      it('opens every row the caller opens', () => {
        expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
        expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });

      it('folds only the row folded by hand', async () => {
        await user.click(firstTrigger);

        expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
        expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });
    });

    describe('with the first row opened by hand', () => {
      beforeEach(async () => {
        await user.click(firstTrigger);
      });

      it('keeps an open row open when another one opens', async () => {
        await user.click(secondTrigger);

        expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
        expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      });

      it('names the body a row button controls', () => {
        const heading = screen.getByRole('heading', {
          level: 3,
          name: new RegExp(MOCK_FIRST_ROW),
        });
        const body = screen.getByText(MOCK_FIRST_BODY);

        expect(heading).toContainElement(firstTrigger);
        expect(firstTrigger.getAttribute('aria-controls')).toBeTruthy();
        expect(body).toBeVisible();
      });

      it('drops the summary while open and keeps the trailing node', () => {
        const mark = screen.queryByTestId(SUMMARY_MARK_TEST_ID);

        expect(firstTrigger).not.toHaveTextContent(MOCK_SUMMARY);
        expect(firstTrigger).toHaveTextContent(MOCK_TRAILING);
        expect(mark).not.toBeInTheDocument();
      });
    });

    it('keeps a folded row body mounted but hidden', () => {
      const body = screen.getByText(MOCK_FIRST_BODY);

      expect(body).toBeInTheDocument();
      expect(body).not.toBeVisible();
    });

    it('shows the summary, its mark and the trailing node while folded', () => {
      const mark = screen.getByTestId(SUMMARY_MARK_TEST_ID);

      expect(firstTrigger).toHaveTextContent(MOCK_SUMMARY);
      expect(firstTrigger).toHaveTextContent(MOCK_TRAILING);
      expect(firstTrigger).toContainElement(mark);
    });

    it('opens a row from code and moves focus to its button', async () => {
      const jump = screen.getByRole('button', { name: JUMP_TO_SECOND });
      await user.click(jump);

      expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(secondTrigger).toHaveFocus();
    });
  });
});
