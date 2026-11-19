import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  describeComponent,
  extractProps,
  extractVariants,
  findOwnPropsType,
  findPropsType,
  parseSource,
} from './gen-ui-index.mjs';

const FILE = '/virtual/widget.tsx';
const parse = (source) => parseSource(FILE, source);
const describeFixture = (source, name) =>
  describeComponent(parse(source), FILE, name);

describe('findPropsType', () => {
  it('prefers I<Name>Props over an earlier-declared unrelated *Props type', () => {
    const sf = parse(`
      interface ISlotConfigProps { rows: number }
      interface IWidgetProps { label: string }
    `);

    assert.equal(findPropsType(sf, 'Widget')?.name.text, 'IWidgetProps');
  });

  it('prefers T<Name>Props when no I<Name>Props exists', () => {
    const sf = parse(`
      interface ISlotConfigProps { rows: number }
      type TWidgetProps = { label: string };
    `);

    assert.equal(findPropsType(sf, 'Widget')?.name.text, 'TWidgetProps');
  });

  it('falls back to the first *Props declaration in source order', () => {
    const sf = parse(`
      interface ISlotConfigProps { rows: number }
      interface IOtherProps { cols: number }
    `);

    assert.equal(findPropsType(sf, 'Widget')?.name.text, 'ISlotConfigProps');
  });
});

describe('findOwnPropsType', () => {
  it('prefers I<Name>OwnProps over T<Name>OwnProps when a file declares both', () => {
    const sf = parse(`
      type TWidgetOwnProps = { label: string };
      interface IWidgetOwnProps { title: string }
    `);

    assert.equal(findOwnPropsType(sf, 'Widget')?.name.text, 'IWidgetOwnProps');
  });

  it('resolves T<Name>OwnProps when it is the only one', () => {
    const sf = parse(`type TWidgetOwnProps = { label: string };`);

    assert.equal(findOwnPropsType(sf, 'Widget')?.name.text, 'TWidgetOwnProps');
  });

  it('ignores a type that merely ends in OwnProps', () => {
    const sf = parse(`interface IWidgetItemOwnProps { label: string }`);

    assert.equal(findOwnPropsType(sf, 'Widget'), null);
  });
});

describe('extractProps', () => {
  it('reads an interface own members and its extends clause', () => {
    const sf = parse(`
      interface IWidgetProps extends IWithClassName, IWithChildren {
        label: string;
        rows?: number;
      }
    `);

    assert.deepEqual(extractProps(findPropsType(sf, 'Widget'), sf), {
      props: ['label: string', 'rows?: number'],
      extendsList: ['IWithClassName', 'IWithChildren'],
    });
  });

  it('flattens an intersection alias into members and referenced types', () => {
    const sf = parse(`
      type TWidgetProps = { label: string } & IWithClassName & IWithClassName;
    `);

    assert.deepEqual(extractProps(findPropsType(sf, 'Widget'), sf), {
      props: ['label: string'],
      extendsList: ['IWithClassName'],
    });
  });
});

describe('describeComponent OwnProps fallback', () => {
  it('documents the OwnProps members when the props type has none of its own', () => {
    const { props } = describeFixture(
      `
        type TWidgetOwnProps = { label: string; rows?: number };
        export type TWidgetProps<C extends ElementType = 'button'> =
          TPolymorphicProps<C, TWidgetOwnProps>;
        export const Widget = () => null;
      `,
      'Widget',
    );

    assert.deepEqual(props, ['label: string', 'rows?: number']);
  });

  it('keeps a mixin intersected outside the polymorphic wrapper', () => {
    const { props, extendsList } = describeFixture(
      `
        type TWidgetOwnProps = { label: string };
        export type TWidgetProps<C extends ElementType = 'button'> =
          TPolymorphicProps<C, TWidgetOwnProps> & IWithDataTestId;
        export const Widget = () => null;
      `,
      'Widget',
    );

    assert.deepEqual(props, ['label: string']);
    assert.deepEqual(extendsList, ['IWithDataTestId']);
  });

  it('drops a bare <Name>OwnProps reference but keeps its sibling', () => {
    const { extendsList } = describeFixture(
      `
        interface IWidgetOwnProps { label: string }
        export interface IWidgetProps extends IWidgetOwnProps, IWithClassName {}
        export const Widget = () => null;
      `,
      'Widget',
    );

    assert.deepEqual(extendsList, ['IWithClassName']);
  });

  it('keeps a sibling that only mentions the OwnProps name', () => {
    const { extendsList } = describeFixture(
      `
        interface ITagOwnProps { label: string }
        export type TTagProps = TPolymorphicProps<'p', ITagOwnProps> &
          Omit<HTMLAttributes<'p'>, keyof ITagOwnProps>;
        export const Tag = () => null;
      `,
      'Tag',
    );

    assert.deepEqual(extendsList, [
      "Omit<HTMLAttributes<'p'>, keyof ITagOwnProps>",
    ]);
  });

  it('recognises a truncated polymorphic wrapper by its prefix', () => {
    const { extendsList } = describeFixture(
      `
        interface IWidgetOwnProps { label: string }
        export type TWidgetProps<C extends ElementType = 'button'> =
          TPolymorphicProps<C, IWidgetOwnProps & IWithChildren & IWithClassName> &
            IWithDataTestId;
        export const Widget = () => null;
      `,
      'Widget',
    );

    assert.deepEqual(extendsList, ['IWithDataTestId']);
  });

  it('leaves the props list empty when there is no OwnProps sibling', () => {
    const { props, extendsList } = describeFixture(
      `
        export type TWidgetProps<C extends ElementType = 'button'> =
          TPolymorphicProps<C, TSomethingElse>;
        export const Widget = () => null;
      `,
      'Widget',
    );

    assert.deepEqual(props, []);
    assert.deepEqual(extendsList, ['TPolymorphicProps<C, TSomethingElse>']);
  });
});

describe('extractVariants', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gen-ui-index-'));
  after(() => rmSync(dir, { recursive: true, force: true }));

  const writeFixture = (name, source) => {
    const file = join(dir, name);
    writeFileSync(file, source);
    return file;
  };
  const variantsOf = (name, source) => {
    const file = writeFixture(name, source);
    return extractVariants(file, parseSource(file, source));
  };

  writeFixture(
    'recipes.ts',
    `export const ALIGNMENT = { start: 'text-left', center: 'text-center' } as const;`,
  );
  writeFixture(
    'index.ts',
    `export { ALIGNMENT as SHARED_ALIGNMENT } from './recipes';`,
  );

  it('lists the keys of an inline object group', () => {
    assert.deepEqual(
      variantsOf(
        'inline-variants.ts',
        `export const v = tv({ variants: { size: { sm: '', lg: '' } } });`,
      ),
      ['size: sm|lg'],
    );
  });

  it('lists the keys of a group naming an object declared in the same file', () => {
    assert.deepEqual(
      variantsOf(
        'local-variants.ts',
        `
          const ALIGNMENT = { start: '', end: '' } satisfies Record<string, string>;
          export const v = tv({ variants: { contentAlignment: ALIGNMENT } });
        `,
      ),
      ['contentAlignment: start|end'],
    );
  });

  it('lists the keys of a group naming an imported object', () => {
    assert.deepEqual(
      variantsOf(
        'imported-variants.ts',
        `
          import { ALIGNMENT } from './recipes';
          export const v = tv({ variants: { contentAlignment: ALIGNMENT } });
        `,
      ),
      ['contentAlignment: start|center'],
    );
  });

  it('follows a renamed re-export through a barrel', () => {
    assert.deepEqual(
      variantsOf(
        'barrel-variants.ts',
        `
          import { SHARED_ALIGNMENT as ALIGN } from './index';
          export const v = tv({ variants: { contentAlignment: ALIGN } });
        `,
      ),
      ['contentAlignment: start|center'],
    );
  });

  it('skips a group naming something that is not an object', () => {
    assert.deepEqual(
      variantsOf(
        'unresolved-variants.ts',
        `
          import { CARD_GAP } from './missing';
          const RING = 'ring-2';
          export const v = tv({ variants: { gap: CARD_GAP, ring: RING } });
        `,
      ),
      [],
    );
  });
});
