// Fixture-based tests for gen-ui-index's props-resolution helpers.
//
// `pnpm gen:ui-index:check` already fails if the generator regresses, but only
// incidentally: it holds solely while the real component tree happens to
// contain a component exercising each shape. These tests pin the behaviour
// against inline sources instead, so a refactor in packages/ui can't silently
// remove the coverage.
//
// Run with `pnpm gen:ui-index:test` (node's built-in runner — see the PR for
// why these aren't a Vitest project).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  describeComponent,
  extractProps,
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
