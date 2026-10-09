import { VOICE_PORTABLE_TEXT_SCHEMA } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { PortableTextEditor } from './portable-text-editor';

const render = renderWithIntl;

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
    children: [{ _type: 'span', _key: 'bs1', text: 'Bullet one', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'b2',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: 'bs2', text: 'Bullet two', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'o1',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'os1', text: 'Number one', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'o2',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'os2', text: 'Number two', marks: [] }],
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
      { _type: 'span', _key: 'nested1s', text: 'Nested one', marks: [] },
    ],
  },
  {
    _type: 'block',
    _key: 'nested2',
    style: 'normal',
    listItem: 'bullet',
    level: 2,
    children: [
      { _type: 'span', _key: 'nested2s', text: 'Nested two', marks: [] },
    ],
  },
  {
    _type: 'block',
    _key: 'n3',
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: 'n3s', text: 'Outer three', marks: [] }],
  },
];

describe(PortableTextEditor, () => {
  it('mounts with an accessible name and no starting content', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Body' })).toBeVisible();
  });

  it('shows a formatting toolbar when not disabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
  });

  it('offers only the controls the schema allows', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
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
        ariaLabel="Body"
        schema={VOICE_PORTABLE_TEXT_SCHEMA}
      />,
    );

    within(screen.getByRole('toolbar'))
      .getByRole('button', { name: 'Bold' })
      .focus();
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
        ariaLabel="Body"
        schema={VOICE_PORTABLE_TEXT_SCHEMA}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('offers headings and lists under the default schema', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
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
        ariaLabel="Body"
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
        ariaLabel="Body"
        isInvalid={true}
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
        ariaLabel="Body"
        isDisabled={true}
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
        ariaLabel="Body"
        isDisabled={true}
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute('aria-disabled', 'true');
    expect(field).toHaveAttribute('aria-multiline', 'true');
    expect(field).not.toHaveAttribute('tabindex');
  });

  it('keeps its own multiline textbox role and carries no aria-disabled attribute when enabled', () => {
    render(
      <PortableTextEditor
        initialValue={[]}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Body' });
    expect(field).toHaveAttribute('aria-multiline', 'true');
    expect(field).not.toHaveAttribute('aria-disabled');
  });

  it('renders an authored link with a safe href as a real, working anchor', async () => {
    render(
      <PortableTextEditor
        initialValue={linkBody('https://example.com')}
        onChange={() => {}}
        ariaLabel="Body"
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
        ariaLabel="Body"
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
        ariaLabel="Body"
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
        ariaLabel="Body"
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
        ariaLabel="Body"
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

    expect(screen.getByText('Bullet one')).toBeVisible();
    expect(screen.getByText('Bullet two')).toBeVisible();
    expect(screen.getByText('Number one')).toBeVisible();
    expect(screen.getByText('Number two')).toBeVisible();
  });

  it('conveys the true set size and position of a four-item list despite the one-list-per-item DOM', async () => {
    render(
      <PortableTextEditor
        initialValue={fourItemBulletBody}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    const items = await waitFor(() => {
      const found = screen.getAllByRole('listitem');
      expect(found).toHaveLength(4);
      return found;
    });

    items.forEach((item, index) => {
      expect(item).toHaveAttribute('aria-setsize', '4');
      expect(item).toHaveAttribute('aria-posinset', String(index + 1));
    });
  });

  it("continues an outer numbered list's position past a nested sub-list instead of restarting it", async () => {
    render(
      <PortableTextEditor
        initialValue={numberedListWithNestedBulletBody}
        onChange={() => {}}
        ariaLabel="Body"
      />,
    );

    const items = await waitFor(() => {
      const found = screen.getAllByRole('listitem');
      expect(found).toHaveLength(5);
      return found;
    });

    const outerThirdItem = items.find((item) =>
      within(item).queryByText('Outer three'),
    );
    const nestedFirstItem = items.find((item) =>
      within(item).queryByText('Nested one'),
    );
    const nestedSecondItem = items.find((item) =>
      within(item).queryByText('Nested two'),
    );

    expect(outerThirdItem).toHaveAttribute('aria-posinset', '3');
    expect(outerThirdItem).toHaveAttribute('aria-setsize', '3');
    expect(nestedFirstItem).toHaveAttribute('aria-posinset', '1');
    expect(nestedFirstItem).toHaveAttribute('aria-setsize', '2');
    expect(nestedSecondItem).toHaveAttribute('aria-posinset', '2');
    expect(nestedSecondItem).toHaveAttribute('aria-setsize', '2');
  });
});
