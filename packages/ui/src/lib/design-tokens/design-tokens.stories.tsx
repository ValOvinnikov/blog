import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { ColorTable } from './components/color-table';
import { KvList } from './components/kv-list';
import { ShapeSample } from './components/shape-sample';
import { SpacingSample } from './components/spacing-sample';
import { TokenSection } from './components/token-section';
import { TypeSpecimens } from './components/type-specimens';
import type { TToken } from './parse-theme-tokens';
import { tokensByCategory } from './token-registry';

const meta = {
  title: 'Design Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;

type TStory = StoryObj<typeof meta>;

/** Render a titled section, or nothing when the category has no tokens. */
const section = (
  title: string,
  tokens: TToken[],
  render: (tokens: TToken[]) => ReactElement,
): ReactElement =>
  tokens.length === 0 ? (
    <></>
  ) : (
    <TokenSection title={title}>{render(tokens)}</TokenSection>
  );

export const Colour: TStory = {
  render: () =>
    section('Colour', tokensByCategory.color, (t) => <ColorTable tokens={t} />),
};

export const Typography: TStory = {
  render: () =>
    section('Typography', tokensByCategory.typography, (t) => (
      <TypeSpecimens tokens={t} />
    )),
};

export const Fonts: TStory = {
  render: () =>
    section('Fonts', tokensByCategory.font, (t) => (
      <TypeSpecimens tokens={t} fontOnly />
    )),
};

export const Radius: TStory = {
  render: () =>
    section('Radius', tokensByCategory.radius, (t) => (
      <ShapeSample tokens={t} />
    )),
};

export const Spacing: TStory = {
  render: () =>
    section('Spacing', tokensByCategory.spacing, (t) => (
      <SpacingSample tokens={t} />
    )),
};

export const Layout: TStory = {
  render: () =>
    section('Layout', tokensByCategory.layout, (t) => <KvList tokens={t} />),
};

export const Motion: TStory = {
  render: () =>
    section('Motion', tokensByCategory.motion, (t) => <KvList tokens={t} />),
};
