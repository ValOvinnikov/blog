import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Section } from './section';

const ModulePlaceholder = () => (
  <div className="rounded-md border border-dashed border-border p-6 text-center">
    Module content
  </div>
);

const meta = {
  title: 'Atoms/Section',
  component: Section,
  tags: ['autodocs'],
  args: {
    children: <ModulePlaceholder />,
  },
} satisfies Meta<typeof Section>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const SubtleBackground: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.SUBTLE,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      align: ALIGN.START,
      divider: false,
    },
  },
};

export const SurfaceBackground: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.SURFACE,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      align: ALIGN.START,
      divider: false,
    },
  },
};

export const AccentTintBackground: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.ACCENT_TINT,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      align: ALIGN.START,
      divider: false,
    },
  },
};

export const InverseBackground: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.INVERSE,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      align: ALIGN.START,
      divider: false,
    },
  },
};

export const WithDivider: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.DEFAULT,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
      align: ALIGN.START,
      divider: true,
    },
  },
};

export const Centered: TStory = {
  args: {
    appearance: {
      background: BACKGROUND_TONE.SURFACE,
      spacingTop: SPACING_SCALE.LG,
      spacingBottom: SPACING_SCALE.LG,
      containerWidth: CONTAINER_WIDTH.NARROW,
      align: ALIGN.CENTER,
      divider: false,
    },
  },
};
