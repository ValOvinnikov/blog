import type { Decorator } from '@storybook/react-vite';

// The width of a sidebar column, where a card title stays at its narrow size.
export const inNarrowColumn: Decorator = (Story) => (
  <div className="w-[187px]">
    <Story />
  </div>
);

export const threeAcross: Decorator = (Story) => (
  <div className="grid max-w-6xl grid-cols-3 gap-6">
    <Story />
    <Story />
    <Story />
  </div>
);
