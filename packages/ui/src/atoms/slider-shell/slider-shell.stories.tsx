import type { Meta, StoryObj } from '@storybook/react-vite';

import { SliderShell } from './slider-shell';

const meta = {
  title: 'Atoms/SliderShell',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type TStory = StoryObj<typeof meta>;

const hueGradient = `linear-gradient(to right, ${Array.from(
  { length: 13 },
  (_, i) => `oklch(0.53 0.17 ${i * 30})`,
).join(', ')})`;

/**
 * `SliderShell` exposes three independent pieces — `Track`, `Range`, and
 * `Thumb` — each meant to be handed to a different part of a headless
 * behavior library (Base UI's `Slider.Control`/`Slider.Indicator`/
 * `Slider.Thumb`). Composed here without any behavior wired up, to show how
 * the pieces read together; see `Atoms/SliderShell/Track` for the
 * consumer-supplied background on its own.
 */
export const Overview: TStory = {
  render: () => (
    <div className="flex w-64 flex-col gap-10">
      <SliderShell.Track className="relative">
        <SliderShell.Range style={{ width: '35%' }} />
        <SliderShell.Thumb style={{ left: '35%' }} />
      </SliderShell.Track>
      <SliderShell.Track style={{ background: hueGradient }}>
        <SliderShell.Thumb style={{ left: '65%' }} data-checked="" />
      </SliderShell.Track>
    </div>
  ),
};
