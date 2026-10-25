import { VOICE_PORTABLE_TEXT_SCHEMA } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { PortableTextEditor } from './portable-text-editor';

const render = renderWithIntl;

const BULLET_ONE = 'Bullet one';
const BULLET_TWO = 'Bullet two';
const NUMBER_ONE = 'Number one';
const NUMBER_TWO = 'Number two';
const NESTED_ONE = 'Nested one';
const NESTED_TWO = 'Nested two';
const OUTER_THREE = 'Outer three';
const ARIA_PRESSED = 'aria-pressed';
const ARIA_DISABLED = 'aria-disabled';
const ARIA_MULTILINE = 'aria-multiline';
const ARIA_SETSIZE = 'aria-setsize';
const ARIA_POSINSET = 'aria-posinset';

const linkBody = (href: string): TEmailTemplateBlock[] => [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    children: [
      { _type: 'span', _key: 's1', text: 'click me', marks: ['link1'] },
    ],
    markDefs: [{ _key: 'link1', _type: 'link', href }],
  },
];

const listBody: TEmailTemplateBlock[] = [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: 'bs1', text: BULLET_ONE, marks: [] }],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: 'bs2', text: BULLET_TWO, marks: [] }],
  },
  {
    _type: 'block',
    _key: 'o1',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'os1', text: NUMBER_ONE, marks: [] }],
  },
  {
    _type: 'block',
    _key: 'o2',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'os2', text: NUMBER_TWO, marks: [] }],
  },
];

const fourItemBulletBody: TEmailTemplateBlock[] = ['a', 'b', 'c', 'd'].map(
  (letter, index) => ({
    _type: 'block',
    _key: `run-${letter}`,
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [
      {
        _type: 'span',
        _key: `run-${letter}-span`,
        text: `Item ${index + 1}`,
        marks: [],
      },
    ],
  }),
);

const numberedListWithNestedBulletBody: TEmailTemplateBlock[] = [
  {
    _type: 'block',
    _key: 'n1',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'n1s', text: 'Outer one', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'n2',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'n2s', text: 'Outer two', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'nested1',
    style: 'normal',
    listItem: 'bullet',
    level: 2,
    children: [
      { _type: 'span', _key: 'nested1s', text: NESTED_ONE, marks: [] },
    ],
  },
  {
    _type: 'block',
    _key: 'nested2',
    style: 'normal',
    listItem: 'bullet',
    level: 2,
    children: [
      { _type: 'span', _key: 'nested2s', text: NESTED_TWO, marks: [] },
    ],
  },
  {
    _type: 'block',
    _key: 'n3',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'n3s', text: OUTER_THREE, marks: [] }],
  },
];

describe(PortableTextEditor, () => {
  it('mounts with an accessible name and no starting content', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Body' })).toBeVisible();
  });

  it('shows a formatting toolbar when not disabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
  });

  it('offers only the controls the schema allows', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        schema={VOICE_PORTABLE_TEXT_SCHEMA}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Link' })).toBeVisible();
  });

  it('moves focus between toolbar controls with the arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        schema={VOICE_PORTABLE_TEXT_SCHEMA}
      />,
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  it('announces each toggle as not pressed while its format is inactive', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        schema={VOICE_PORTABLE_TEXT_SCHEMA}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      ARIA_PRESSED,
      'false',
    );
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
      ARIA_PRESSED,
      'false',
    );
  });

  it('offers headings and lists under the default schema', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Heading' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeVisible();
  });

  it('shows the placeholder while empty', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        placeholder="No posts yet."
      />,
    );

    expect(screen.getByText('No posts yet.')).toBeVisible();
  });

  it('marks the field invalid and points it at its description', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body', isInvalid: true }}
        aria-describedby="body-error"
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', 'body-error');
  });

  it('hides the formatting toolbar when disabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        mode={CONTROL_MODE.DISABLED}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Bold' }),
    ).not.toBeInTheDocument();
  });

  it('conveys its disabled state to assistive technology as a dimmed text field, not only visually', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        mode={CONTROL_MODE.DISABLED}
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(field).toHaveAttribute(ARIA_MULTILINE, 'true');
    expect(field).not.toHaveAttribute('tabindex');
  });

  it('announces a read-only editor as a focusable, read-only text field with no toolbar', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
        mode={CONTROL_MODE.READ_ONLY}
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute('aria-readonly', 'true');
    expect(field).not.toHaveAttribute(ARIA_DISABLED);
    expect(field).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps its own multiline textbox role and carries no aria-disabled attribute when enabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute(ARIA_MULTILINE, 'true');
    expect(field).not.toHaveAttribute(ARIA_DISABLED);
  });

  it('renders an authored link with a safe href as a real, working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('https://example.com')}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'click me' })).toHaveAttribute(
        'href',
        'https://example.com/',
      );
    });
  });

  it('strips a javascript: href instead of rendering it as a working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('javascript:alert(1)')}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeVisible();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('strips a data: href instead of rendering it as a working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('data:text/html,<script>alert(1)</script>')}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeVisible();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('strips a case- and whitespace-obfuscated javascript: href', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('  JaVaScRiPt:alert(1)')}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('click me')).toBeVisible();
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders bulleted and numbered list items inside real list containers', async () => {
    render(
      <PortableTextEditor
        initialValue={listBody}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(4);
    for (const list of lists) {
      expect(list).toBeVisible();
    }
    expect(lists[2]).toHaveAttribute('start', '1');
    expect(lists[3]).toHaveAttribute('start', '2');

    const items = screen.getAllByRole('listitem');
    for (const item of items) {
      expect(item).toBeVisible();
    }

    expect(screen.getByText(BULLET_ONE)).toBeVisible();
    expect(screen.getByText(BULLET_TWO)).toBeVisible();
    expect(screen.getByText(NUMBER_ONE)).toBeVisible();
    expect(screen.getByText(NUMBER_TWO)).toBeVisible();
  });

  it('conveys the true set size and position of a four-item list despite the one-list-per-item DOM', async () => {
    render(
      <PortableTextEditor
        initialValue={fourItemBulletBody}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    const items = await waitFor(() => {
      const found = screen.getAllByRole('listitem');
      expect(found).toHaveLength(4);
      return found;
    });

    items.forEach((item, index) => {
      expect(item).toHaveAttribute(ARIA_SETSIZE, '4');
      expect(item).toHaveAttribute(ARIA_POSINSET, String(index + 1));
    });
  });

  it("continues an outer numbered list's position past a nested sub-list instead of restarting it", async () => {
    render(
      <PortableTextEditor
        initialValue={numberedListWithNestedBulletBody}
        onChange={() => {}}
        field={{ label: 'Body' }}
      />,
    );

    const items = await waitFor(() => {
      const found = screen.getAllByRole('listitem');
      expect(found).toHaveLength(5);
      return found;
    });

    const outerThirdItem = items.find((item) =>
      within(item).queryByText(OUTER_THREE),
    );
    const nestedFirstItem = items.find((item) =>
      within(item).queryByText(NESTED_ONE),
    );
    const nestedSecondItem = items.find((item) =>
      within(item).queryByText(NESTED_TWO),
    );

    expect(outerThirdItem).toHaveAttribute(ARIA_POSINSET, '3');
    expect(outerThirdItem).toHaveAttribute(ARIA_SETSIZE, '3');
    expect(nestedFirstItem).toHaveAttribute(ARIA_POSINSET, '1');
    expect(nestedFirstItem).toHaveAttribute(ARIA_SETSIZE, '2');
    expect(nestedSecondItem).toHaveAttribute(ARIA_POSINSET, '2');
    expect(nestedSecondItem).toHaveAttribute(ARIA_SETSIZE, '2');
  });
});
