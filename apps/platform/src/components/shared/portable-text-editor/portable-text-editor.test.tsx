import { SIZE, VOICE_PORTABLE_TEXT_SCHEMA } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { faker } from '@faker-js/faker';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  BULLET_LIST_ITEM,
  mockTextBlock,
  NUMBER_LIST_ITEM,
} from '@platform/testing/portable-text-editor/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PortableTextEditor } from './portable-text-editor';

faker.seed(5995);

const t = makeEnTranslator('portableTextEditorToolbar');

const MOCK_LABEL = faker.lorem.word();
const MOCK_PLACEHOLDER = faker.lorem.sentence();
const MOCK_DESCRIPTION_ID = faker.string.alpha(8);
const MOCK_LINK_TEXT = faker.lorem.words(2);
const MOCK_URL = faker.internet.url({ appendSlash: true });
const MOCK_ITEM_ONE = faker.lorem.words(3);
const MOCK_ITEM_TWO = faker.lorem.words(3);
const MOCK_ITEM_THREE = faker.lorem.words(3);
const MOCK_ITEM_FOUR = faker.lorem.words(3);
const MOCK_ITEM_FIVE = faker.lorem.words(3);
const ARIA_PRESSED = 'aria-pressed';
const ARIA_MULTILINE = 'aria-multiline';
const ARIA_SETSIZE = 'aria-setsize';
const ARIA_POSINSET = 'aria-posinset';

const mockLinkBody = (href: string): TEmailTemplateBlock[] => {
  const linkKey = faker.string.uuid();
  return [
    {
      _type: 'block',
      _key: faker.string.uuid(),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: faker.string.uuid(),
          text: MOCK_LINK_TEXT,
          marks: [linkKey],
        },
      ],
      markDefs: [{ _key: linkKey, _type: 'link', href }],
    },
  ];
};

const setup = customRender(PortableTextEditor, {
  initialValue: [],
  onChange: vi.fn(),
  field: { label: MOCK_LABEL },
});

describe(`<${PortableTextEditor.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default schema', () => {
    beforeEach(() => {
      setup();
    });

    it('is an enabled, named, multiline text field', () => {
      const field = screen.getByRole('textbox', { name: MOCK_LABEL });

      expect(field).toBeVisible();
      expect(field).toHaveAttribute(ARIA_MULTILINE, 'true');
      expect(field).not.toHaveAttribute(ARIA_DISABLED);
    });

    it.each([t('bold'), t('heading'), t('bulletList')])(
      'offers the %s control',
      (name) => {
        const control = screen.getByRole('button', { name });

        expect(control).toBeVisible();
      },
    );
  });

  describe('with the Voice schema', () => {
    beforeEach(() => {
      setup({ schema: VOICE_PORTABLE_TEXT_SCHEMA });
    });

    it('offers only the controls the schema allows', () => {
      const controls = screen.getAllByRole('button');
      const allowedControls = [t('bold'), t('italic'), t('link')].map((name) =>
        screen.getByRole('button', { name }),
      );

      expect(controls).toEqual(allowedControls);
    });

    it('moves focus between toolbar controls with the arrow keys', async () => {
      const boldButton = screen.getByRole('button', { name: t('bold') });
      const italicButton = screen.getByRole('button', { name: t('italic') });

      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(italicButton).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(boldButton).toHaveFocus();
    });

    it.each([t('bold'), t('italic')])(
      'announces %s as not pressed while its format is inactive',
      (name) => {
        const toggle = screen.getByRole('button', { name });

        expect(toggle).toHaveAttribute(ARIA_PRESSED, 'false');
      },
    );
  });

  describe('in the compact size with the Voice schema', () => {
    it('offers Bold, Italic and Link by name', () => {
      setup({ schema: VOICE_PORTABLE_TEXT_SCHEMA, size: SIZE.SM });

      const controls = screen.getAllByRole('button');
      const allowedControls = [t('bold'), t('italic'), t('link')].map((name) =>
        screen.getByRole('button', { name }),
      );

      expect(controls).toEqual(allowedControls);
    });

    it.each([CONTROL_MODE.READ_ONLY, CONTROL_MODE.DISABLED])(
      'shows no toolbar when %s',
      (mode) => {
        setup({ schema: VOICE_PORTABLE_TEXT_SCHEMA, size: SIZE.SM, mode });

        const toolbarButton = screen.queryByRole('button');

        expect(toolbarButton).not.toBeInTheDocument();
      },
    );
  });

  describe('when disabled', () => {
    beforeEach(() => {
      setup({ mode: CONTROL_MODE.DISABLED });
    });

    it('hides the formatting toolbar', () => {
      const boldButton = screen.queryByRole('button', { name: t('bold') });

      expect(boldButton).not.toBeInTheDocument();
    });

    it('conveys its disabled state to assistive technology', () => {
      const field = screen.getByRole('textbox', { name: MOCK_LABEL });

      expect(field).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(field).toHaveAttribute(ARIA_MULTILINE, 'true');
      expect(field).not.toHaveAttribute('tabindex');
    });
  });

  it('announces a read-only editor as focusable and read-only, with no toolbar', () => {
    setup({ mode: CONTROL_MODE.READ_ONLY });

    const field = screen.getByRole('textbox', { name: MOCK_LABEL });
    const toolbarButton = screen.queryByRole('button');

    expect(field).toHaveAttribute('aria-readonly', 'true');
    expect(field).not.toHaveAttribute(ARIA_DISABLED);
    expect(field).toHaveAttribute('tabindex', '0');
    expect(toolbarButton).not.toBeInTheDocument();
  });

  it('shows the placeholder while empty', () => {
    setup({ placeholder: MOCK_PLACEHOLDER });

    const placeholder = screen.getByText(MOCK_PLACEHOLDER);

    expect(placeholder).toBeVisible();
  });

  it('marks the field invalid and points it at its description', () => {
    setup({
      field: {
        label: MOCK_LABEL,
        isInvalid: true,
        describedBy: MOCK_DESCRIPTION_ID,
      },
    });

    const field = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', MOCK_DESCRIPTION_ID);
  });

  it('renders an authored link with a safe href as a working anchor', async () => {
    setup({ initialValue: mockLinkBody(MOCK_URL) });

    const link = await screen.findByRole('link', { name: MOCK_LINK_TEXT });

    expect(link).toHaveAttribute('href', MOCK_URL);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '  JaVaScRiPt:alert(1)',
  ])('strips the unsafe href %j from an authored link', async (href) => {
    setup({ initialValue: mockLinkBody(href) });

    const linkText = await screen.findByText(MOCK_LINK_TEXT);
    const link = screen.queryByRole('link');

    expect(linkText).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('renders bulleted and numbered list items inside real list containers', async () => {
    setup({
      initialValue: [
        mockTextBlock({ text: MOCK_ITEM_ONE, listItem: BULLET_LIST_ITEM }),
        mockTextBlock({ text: MOCK_ITEM_TWO, listItem: BULLET_LIST_ITEM }),
        mockTextBlock({ text: MOCK_ITEM_THREE, listItem: NUMBER_LIST_ITEM }),
        mockTextBlock({ text: MOCK_ITEM_FOUR, listItem: NUMBER_LIST_ITEM }),
      ],
    });

    const items = await screen.findAllByRole('listitem');
    const lists = screen.getAllByRole('list');
    const [, , firstNumberedList, secondNumberedList] = lists;

    expect(items.map((item) => item.textContent)).toEqual([
      MOCK_ITEM_ONE,
      MOCK_ITEM_TWO,
      MOCK_ITEM_THREE,
      MOCK_ITEM_FOUR,
    ]);
    expect(lists).toHaveLength(4);
    expect(firstNumberedList).toHaveAttribute('start', '1');
    expect(secondNumberedList).toHaveAttribute('start', '2');
  });

  it('conveys the set size and position of each item in a four-item list', async () => {
    setup({
      initialValue: [
        MOCK_ITEM_ONE,
        MOCK_ITEM_TWO,
        MOCK_ITEM_THREE,
        MOCK_ITEM_FOUR,
      ].map((text) => mockTextBlock({ text, listItem: BULLET_LIST_ITEM })),
    });

    const items = await screen.findAllByRole('listitem');
    const positions = items.map((item) => [
      item.getAttribute(ARIA_POSINSET),
      item.getAttribute(ARIA_SETSIZE),
    ]);

    expect(positions).toEqual([
      ['1', '4'],
      ['2', '4'],
      ['3', '4'],
      ['4', '4'],
    ]);
  });

  it('continues an outer numbered list past a nested sub-list', async () => {
    setup({
      initialValue: [
        mockTextBlock({ text: MOCK_ITEM_ONE, listItem: NUMBER_LIST_ITEM }),
        mockTextBlock({ text: MOCK_ITEM_TWO, listItem: NUMBER_LIST_ITEM }),
        mockTextBlock({
          text: MOCK_ITEM_THREE,
          listItem: BULLET_LIST_ITEM,
          level: 2,
        }),
        mockTextBlock({
          text: MOCK_ITEM_FOUR,
          listItem: BULLET_LIST_ITEM,
          level: 2,
        }),
        mockTextBlock({ text: MOCK_ITEM_FIVE, listItem: NUMBER_LIST_ITEM }),
      ],
    });

    const items = await screen.findAllByRole('listitem');
    const findItem = (text: string) =>
      items.find((item) => within(item).queryByText(text));
    const outerThirdItem = findItem(MOCK_ITEM_FIVE);
    const nestedFirstItem = findItem(MOCK_ITEM_THREE);
    const nestedSecondItem = findItem(MOCK_ITEM_FOUR);

    expect(outerThirdItem).toHaveAttribute(ARIA_POSINSET, '3');
    expect(outerThirdItem).toHaveAttribute(ARIA_SETSIZE, '3');
    expect(nestedFirstItem).toHaveAttribute(ARIA_POSINSET, '1');
    expect(nestedFirstItem).toHaveAttribute(ARIA_SETSIZE, '2');
    expect(nestedSecondItem).toHaveAttribute(ARIA_POSINSET, '2');
    expect(nestedSecondItem).toHaveAttribute(ARIA_SETSIZE, '2');
  });
});
