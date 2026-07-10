import type { Meta, StoryObj } from '@storybook/react';

import { ColorTable } from './components/color-table';
import { KvList } from './components/kv-list';
import { ShapeSample } from './components/shape-sample';
import { TokenSection } from './components/token-section';
import { TypeSpecimens } from './components/type-specimens';
import { tokensByCategory } from './token-registry';

const meta = {
  title: 'Design Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;

type TStory = StoryObj<typeof meta>;

export const Colour: TStory = {
  render: () => (
    <TokenSection title="Colour">
      <ColorTable tokens={tokensByCategory.color} />
    </TokenSection>
  ),
};

export const Typography: TStory = {
  render: () => (
    <TokenSection title="Typography">
      <TypeSpecimens tokens={tokensByCategory.typography} />
    </TokenSection>
  ),
};

export const Fonts: TStory = {
  render: () => (
    <TokenSection title="Fonts">
      <TypeSpecimens tokens={tokensByCategory.font} fontOnly />
    </TokenSection>
  ),
};

export const Radius: TStory = {
  render: () => (
    <TokenSection title="Radius">
      <ShapeSample tokens={tokensByCategory.radius} />
    </TokenSection>
  ),
};

export const Spacing: TStory = {
  render: () => (
    <TokenSection title="Spacing">
      <KvList tokens={tokensByCategory.spacing} />
    </TokenSection>
  ),
};

export const Motion: TStory = {
  render: () => (
    <TokenSection title="Motion">
      <KvList
        tokens={[...tokensByCategory.layout, ...tokensByCategory.motion]}
      />
    </TokenSection>
  ),
};
